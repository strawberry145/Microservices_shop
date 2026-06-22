import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { logger } from './lib/logger';
import { getDb } from './db';
import { productClient } from './grpc-client';
import { connectKafkaProducer, producer } from './kafka';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../../../lib/protos/src/order.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const orderProto = grpc.loadPackageDefinition(packageDefinition).order as any;

const server = new grpc.Server();

// Helper to fetch product details via gRPC
const fetchProduct = (productId: number): Promise<any> => {
    return new Promise((resolve, reject) => {
        productClient.GetProduct({ id: productId }, (err: any, response: any) => {
            if (err) resolve(null); // Return null instead of rejecting to avoid breaking the loop
            else resolve(response);
        });
    });
};

server.addService(orderProto.OrderService.service, {
  ListOrders: async (call: any, callback: any) => {
    try {
      const { user_id } = call.request;
      const db = await getDb();
      
      const orders = await db.orders.find({
          selector: { userId: user_id },
          sort: [{ createdAt: 'desc' }]
      }).exec();
      
      const summaries = await Promise.all(orders.map(async (doc: any) => {
        const o = doc.toJSON();
        let primaryImage = null;
        
        // Find the image of the first item
        if (o.items && o.items.length > 0) {
            // Wait, we only have skuId. In this simple demo, we will skip the image for the summary 
            // or fetch the product if we had a mapping. For now, let's leave primaryImage as null
            // unless we want to query the entire catalogue.
        }

        return {
          id: parseInt(o.id.replace('order_', '')), // mock ID logic
          status: o.status,
          total: o.total,
          item_count: o.items.reduce((acc: number, curr: any) => acc + curr.quantity, 0),
          primary_image: primaryImage,
          tracking_number: o.trackingNumber,
          created_at: o.createdAt
        };
      }));

      callback(null, { items: summaries });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },
  
  PlaceOrder: async (call: any, callback: any) => {
    try {
      const { user_id, items, shipping_address_id, notes } = call.request;
      const db = await getDb();

      if (!items || items.length === 0) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: "Order must contain at least one item" });
        return;
      }

      // To calculate total, we'd normally fetch SKUs. 
      // For this simplified RxDB demo, we use the unit_price passed from the gateway, or default to 100
      let total = 0;
      const orderItemsData = items.map((item: any) => {
          const price = item.unit_price || 100.0;
          total += price * item.quantity;
          return {
              skuId: item.sku_id,
              quantity: item.quantity,
              unitPrice: price
          };
      });

      let addressObj = null;
      if (shipping_address_id) {
          const addressDoc = await db.addresses.findOne({ selector: { id: `addr_${shipping_address_id}` } }).exec();
          if (addressDoc) {
              const a = addressDoc.toJSON();
              addressObj = {
                  id: parseInt(a.id.replace('addr_', '')),
                  label: a.label, street: a.street, city: a.city, country: a.country, 
                  postalCode: a.postalCode, isDefault: a.isDefault
              };
          }
      }

      const orderIdInt = Math.floor(Math.random() * 1000000);
      const orderData = {
        id: `order_${orderIdInt}`,
        userId: user_id,
        status: "pending",
        total: total,
        shippingAddress: addressObj,
        notes: notes || null,
        items: orderItemsData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.orders.insert(orderData);

      // Publish Kafka event
      try {
        await producer.send({
          topic: 'order.placed',
          messages: [
            { value: JSON.stringify({ orderId: orderIdInt, items: orderItemsData }) }
          ]
        });
        console.log(`📤 [Kafka] Published order.placed event for Order ${orderIdInt}`);
      } catch (err: any) {
        console.error(`❌ [Kafka] Failed to publish order.placed:`, err.message);
      }

      callback(null, {
        id: orderIdInt,
        status: orderData.status,
        total: orderData.total,
        created_at: orderData.createdAt,
        items: orderItemsData.map((d: any) => ({
          sku_id: d.skuId,
          quantity: d.quantity,
          unit_price: d.unitPrice
        }))
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },

  GetOrder: async (call: any, callback: any) => {
    try {
      const { user_id, order_id } = call.request;
      const db = await getDb();
      
      const doc = await db.orders.findOne({
          selector: { id: `order_${order_id}`, userId: user_id }
      }).exec();

      if (!doc) {
        callback({ code: grpc.status.NOT_FOUND, message: "Order not found" });
        return;
      }

      const order = doc.toJSON();

      const formattedItems = await Promise.all(order.items.map(async (item: any) => {
        // Without direct DB access to products, we return basic data
        // For a full implementation, we would query the Product gRPC service here.
        return {
          id: item.skuId, // mocked
          sku_id: item.skuId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          product_name: `Product for SKU ${item.skuId}`,
          product_image: null,
          sku: {
            id: item.skuId, product_id: 1, size_eu: 40,
            price: item.unitPrice
          }
        };
      }));

      callback(null, {
        id: parseInt(order.id.replace('order_', '')),
        status: order.status,
        total: order.total,
        tracking_number: order.trackingNumber,
        carrier: order.carrier,
        notes: order.notes,
        estimated_delivery: order.estimatedDelivery,
        shipping_address: order.shippingAddress,
        items: formattedItems,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },

  CancelOrder: async (call: any, callback: any) => {
    try {
      const { user_id, order_id } = call.request;
      const db = await getDb();
      
      const doc = await db.orders.findOne({
          selector: { id: `order_${order_id}`, userId: user_id }
      }).exec();

      if (!doc) {
        callback({ code: grpc.status.NOT_FOUND, message: "Order not found" });
        return;
      }

      const order = doc.toJSON();
      if (order.status !== 'pending' && order.status !== 'confirmed') {
        callback({ code: grpc.status.FAILED_PRECONDITION, message: "Order cannot be cancelled in its current state" });
        return;
      }

      await doc.patch({ status: 'cancelled', updatedAt: new Date().toISOString() });

      callback(null, {
        id: parseInt(order.id.replace('order_', '')),
        status: 'cancelled',
        total: order.total,
        created_at: order.createdAt
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },

  // Address logic
  ListAddresses: async (call: any, callback: any) => {
    try {
      const { user_id } = call.request;
      const db = await getDb();
      const docs = await db.addresses.find({ selector: { userId: user_id } }).exec();
      
      callback(null, { 
        items: docs.map((doc: any) => {
            const a = doc.toJSON();
            return {
                id: parseInt(a.id.replace('addr_', '')), 
                label: a.label, street: a.street, city: a.city, country: a.country, 
                postal_code: a.postalCode, is_default: a.isDefault
            };
        }) 
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },
  
  CreateAddress: async (call: any, callback: any) => {
    try {
      const { user_id, label, street, city, country, postal_code, is_default } = call.request;
      const db = await getDb();
      
      if (is_default) {
        const defaults = await db.addresses.find({ selector: { userId: user_id, isDefault: true } }).exec();
        for (const d of defaults) {
            await d.patch({ isDefault: false });
        }
      }

      const idInt = Date.now();
      const addrData = {
          id: `addr_${idInt}`,
          userId: user_id, label, street, city, country, postalCode: postal_code, isDefault: is_default || false
      };
      
      await db.addresses.insert(addrData);

      callback(null, {
        id: idInt, label: addrData.label, street: addrData.street, city: addrData.city, 
        country: addrData.country, postal_code: addrData.postalCode, is_default: addrData.isDefault
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },

  DeleteAddress: async (call: any, callback: any) => {
    try {
      const { user_id, address_id } = call.request;
      const db = await getDb();
      const doc = await db.addresses.findOne({ selector: { id: `addr_${address_id}`, userId: user_id } }).exec();
      if (doc) await doc.remove();
      callback(null, {});
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },

  // Wishlist logic
  GetWishlist: async (call: any, callback: any) => {
    try {
      const { user_id } = call.request;
      const db = await getDb();
      const docs = await db.wishlists.find({ selector: { userId: user_id } }).exec();
      
      const formattedItems = await Promise.all(docs.map(async (doc: any) => {
        const item = doc.toJSON();
        const product = await fetchProduct(item.productId);
        
        return {
          id: parseInt(item.id.replace('wish_', '')),
          product_id: item.productId,
          added_at: item.addedAt,
          product: product ? {
            id: product.id, name: product.name, brand: product.brand, style: product.style, heel_height: product.heel_height,
            base_price: product.base_price, min_price: product.base_price, max_price: product.base_price, sale_price: product.sale_price,
            primary_image: product.images?.[0]?.url || null, colour_count: 1, is_new: product.is_new, is_featured: product.is_featured
          } : { id: item.productId, name: `Unknown Product ${item.productId}` }
        };
      }));
      
      callback(null, { items: formattedItems });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },

  AddToWishlist: async (call: any, callback: any) => {
    try {
      const { user_id, product_id } = call.request;
      const db = await getDb();
      
      const existing = await db.wishlists.findOne({ selector: { userId: user_id, productId: product_id } }).exec();

      if (existing) {
        callback({ code: grpc.status.ALREADY_EXISTS, message: "Product already in wishlist" });
        return;
      }

      const product = await fetchProduct(product_id);
      if (!product) {
        callback({ code: grpc.status.NOT_FOUND, message: "Product not found" });
        return;
      }

      const idInt = Date.now();
      const data = {
        id: `wish_${idInt}`, userId: user_id, productId: product_id, addedAt: new Date().toISOString()
      };
      await db.wishlists.insert(data);

      callback(null, { id: idInt, product_id: product_id, added_at: data.addedAt });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },

  RemoveFromWishlist: async (call: any, callback: any) => {
    try {
      const { user_id, product_id } = call.request;
      const db = await getDb();
      const doc = await db.wishlists.findOne({ selector: { userId: user_id, productId: product_id } }).exec();
      if (doc) await doc.remove();
      callback(null, {});
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  }
});

const port = Number(process.env["ORDER_PORT"]) || 50053;

// Start Kafka Producer
connectKafkaProducer();

server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    logger.error(err);
    return;
  }
  logger.info(`Order gRPC Microservice listening on port ${boundPort}`);
});
