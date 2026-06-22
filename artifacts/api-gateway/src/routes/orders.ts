import { Router } from "express";
import { orderClient } from "../lib/grpc";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.get("/orders", (req: any, res: any): void => {
  orderClient.ListOrders({ user_id: req.user.id }, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(response.items ? response.items.map((o: any) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      itemCount: o.item_count,
      primaryImage: o.primary_image,
      trackingNumber: o.tracking_number,
      createdAt: o.created_at
    })) : []);
  });
});

router.post("/orders", (req: any, res: any): void => {
  const { items, shippingAddressId, notes } = req.body;
  orderClient.PlaceOrder({ 
    user_id: req.user.id, 
    items: items.map((i: any) => ({ sku_id: i.skuId, quantity: i.quantity })),
    shipping_address_id: shippingAddressId, 
    notes 
  }, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      id: response.id,
      status: response.status,
      total: response.total,
      createdAt: response.created_at,
      items: response.items.map((i: any) => ({
        skuId: i.sku_id,
        quantity: i.quantity,
        unitPrice: i.unit_price
      }))
    });
  });
});

router.get("/orders/:id", (req: any, res: any): void => {
  orderClient.GetOrder({ user_id: req.user.id, order_id: Number(req.params.id) }, (err: any, response: any) => {
    if (err) {
      if (err.code === 5) { // NOT_FOUND
        res.status(404).json({ error: "Order not found" });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    
    // Map camelCase back to frontend expectations
    res.json({
      id: response.id,
      status: response.status,
      total: response.total,
      trackingNumber: response.tracking_number,
      carrier: response.carrier,
      notes: response.notes,
      estimatedDelivery: response.estimated_delivery,
      shippingAddress: response.shipping_address ? {
        id: response.shipping_address.id, label: response.shipping_address.label,
        street: response.shipping_address.street, city: response.shipping_address.city,
        country: response.shipping_address.country, postalCode: response.shipping_address.postal_code,
        isDefault: response.shipping_address.is_default
      } : undefined,
      items: response.items.map((item: any) => ({
        id: item.id, skuId: item.sku_id, quantity: item.quantity, unitPrice: item.unit_price,
        productName: item.product_name, productImage: item.product_image,
        sku: {
          id: item.sku.id, productId: item.sku.product_id, sizeEu: item.sku.size_eu,
          sizeUs: item.sku.size_us, sizeUk: item.sku.size_uk, colour: item.sku.colour,
          colourHex: item.sku.colour_hex, stockQuantity: item.sku.stock_quantity,
          price: item.sku.price, skuCode: item.sku.sku_code
        }
      })),
      createdAt: response.created_at,
      updatedAt: response.updated_at
    });
  });
});

router.post("/orders/:id/cancel", (req: any, res: any): void => {
  orderClient.CancelOrder({ user_id: req.user.id, order_id: Number(req.params.id) }, (err: any, response: any) => {
    if (err) {
      if (err.code === 5) { // NOT_FOUND
        res.status(404).json({ error: "Order not found" });
      } else if (err.code === 9) { // FAILED_PRECONDITION
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.json({
      id: response.id,
      status: response.status,
      total: response.total,
      createdAt: response.created_at
    });
  });
});

export default router;
