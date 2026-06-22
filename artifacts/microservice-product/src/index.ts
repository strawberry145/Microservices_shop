import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { logger } from './lib/logger';
import { dbProduct as db, productsTable, skusTable, productImagesTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import url from 'url';
import { connectKafkaConsumer } from './kafka';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../../../lib/protos/src/product.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const productProto = grpc.loadPackageDefinition(packageDefinition).product as any;

// Product retrieval logic
async function getAllProductsFromDb() {
  const products = await db.select().from(productsTable);
  const skus = await db.select().from(skusTable);
  const images = await db.select().from(productImagesTable);

  return products.map(p => {
    const productSkus = skus.filter(s => s.productId === p.id);
    const productImages = images.filter(i => i.productId === p.id);
    const primaryImage = productImages.find(i => i.isPrimary)?.url ?? productImages[0]?.url ?? null;
    const colours = [...new Set(productSkus.map(s => s.colour))];
    const basePrice = parseFloat(p.basePrice as unknown as string);
    const salePrice = p.salePrice ? parseFloat(p.salePrice as unknown as string) : null;
    const prices = productSkus.map(s => s.priceOverride ? parseFloat(s.priceOverride as unknown as string) : basePrice);
    const minPrice = prices.length > 0 ? Math.min(...prices) : basePrice;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : basePrice;

    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      style: p.style,
      heel_height: p.heelHeight,
      base_price: basePrice,
      min_price: minPrice,
      max_price: maxPrice,
      sale_price: salePrice,
      primary_image: primaryImage,
      colour_count: colours.length,
      is_new: p.isNew,
      is_featured: p.isFeatured,
      // Internal fields for filtering:
      sizes: [...new Set(productSkus.map(s => parseFloat(s.sizeEu as unknown as string)))],
      coloursList: colours,
      createdAt: p.createdAt,
      popularity: p.id,
    };
  });
}

function mapToSummary(p: any) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    style: p.style,
    heel_height: p.heel_height,
    base_price: p.base_price,
    min_price: p.min_price,
    max_price: p.max_price,
    sale_price: p.sale_price,
    primary_image: p.primary_image,
    colour_count: p.colour_count,
    is_new: p.is_new,
    is_featured: p.is_featured,
  };
}

const server = new grpc.Server();

server.addService(productProto.ProductService.service, {
  ListProducts: async (call: any, callback: any) => {
    try {
      const { style, heel_height, brand, min_price, max_price, size_eu, colour, search, sort, limit = 24, offset = 0 } = call.request;
      let items = await getAllProductsFromDb();

      if (style) items = items.filter(p => p.style === style);
      if (brand) items = items.filter(p => p.brand === brand);
      if (heel_height) items = items.filter(p => p.heel_height === heel_height);
      if (min_price) items = items.filter(p => p.sale_price ? p.sale_price >= min_price : p.min_price >= min_price);
      if (max_price) items = items.filter(p => p.sale_price ? p.sale_price <= max_price : p.min_price <= max_price);
      if (size_eu) items = items.filter(p => p.sizes.includes(size_eu));
      if (colour) items = items.filter(p => p.coloursList.includes(colour as string));
      if (search) {
        const s = String(search).toLowerCase();
        items = items.filter(p => p.name.toLowerCase().includes(s) || (p.brand && p.brand.toLowerCase().includes(s)));
      }

      if (sort === "price_asc") items.sort((a, b) => (a.sale_price || a.min_price) - (b.sale_price || b.min_price));
      else if (sort === "price_desc") items.sort((a, b) => (b.sale_price || b.min_price) - (a.sale_price || a.min_price));
      else if (sort === "popular") items.sort((a, b) => b.popularity - a.popularity);
      else items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = items.length;
      items = items.slice(offset, offset + limit);

      callback(null, { items: items.map(mapToSummary), total, limit, offset });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },
  GetProduct: async (call: any, callback: any) => {
    try {
      const { id } = call.request;
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
      if (!product) { callback({ code: grpc.status.NOT_FOUND, message: "Product not found" }); return; }
      
      const skus = await db.select().from(skusTable).where(eq(skusTable.productId, product.id));
      const images = await db.select().from(productImagesTable).where(eq(productImagesTable.productId, product.id));
      
      callback(null, {
          id: product.id,
          name: product.name,
          brand: product.brand,
          description: product.description,
          style: product.style,
          heel_height: product.heelHeight,
          material: product.material,
          base_price: parseFloat(product.basePrice as unknown as string),
          category: product.category,
          is_active: product.isActive,
          is_new: product.isNew,
          is_featured: product.isFeatured,
          images: images.map(i => ({
            id: i.id, url: i.url, alt_text: i.altText, is_primary: i.isPrimary, sort_order: i.sortOrder
          })),
          skus: skus.map(s => ({
            id: s.id, product_id: s.productId, 
            size_eu: parseFloat(s.sizeEu as unknown as string), 
            size_us: s.sizeUs ? parseFloat(s.sizeUs as unknown as string) : null, 
            size_uk: s.sizeUk ? parseFloat(s.sizeUk as unknown as string) : null, 
            colour: s.colour, colour_hex: s.colourHex, stock_quantity: s.stockQuantity, 
            price: s.priceOverride ? parseFloat(s.priceOverride as unknown as string) : parseFloat(product.basePrice as unknown as string), 
            sku_code: s.skuCode
          }))
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },
  GetCatalogueStats: async (_call: any, callback: any) => {
    try {
      const items = await getAllProductsFromDb();
      const brands = [...new Set(items.map(p => p.brand).filter(Boolean))];
      const styles = [...new Set(items.map(p => p.style).filter(Boolean))];
      const heel_heights = [...new Set(items.map(p => p.heel_height).filter(Boolean))];
      const available_sizes = [...new Set(items.flatMap(p => p.sizes))].sort((a,b)=>a-b);
      const colours = [...new Set(items.flatMap(p => p.coloursList))];
      const min_price = items.length > 0 ? Math.min(...items.map(p => p.sale_price || p.min_price)) : 0;
      const max_price = items.length > 0 ? Math.max(...items.map(p => p.max_price)) : 1000;
      
      callback(null, { brands, styles, heel_heights, available_sizes, colours, min_price, max_price });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },
  GetFeaturedProducts: async (call: any, callback: any) => {
    try {
      const limit = call.request.limit || 8;
      const items = await getAllProductsFromDb();
      callback(null, { items: items.filter(p => p.is_featured).slice(0, limit).map(mapToSummary) });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },
  GetNewArrivals: async (call: any, callback: any) => {
    try {
      const limit = call.request.limit || 8;
      const items = await getAllProductsFromDb();
      callback(null, { items: items.filter(p => p.is_new).slice(0, limit).map(mapToSummary) });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },
  GetOnSaleProducts: async (call: any, callback: any) => {
    try {
      const limit = call.request.limit || 8;
      const items = await getAllProductsFromDb();
      callback(null, { items: items.filter(p => p.sale_price !== null).slice(0, limit).map(mapToSummary) });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  }
});

const port = Number(process.env["PRODUCT_PORT"]) || 50052;

// Start Kafka Consumer
connectKafkaConsumer();

server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    logger.error(err);
    return;
  }
  logger.info(`Product gRPC Microservice listening on port ${boundPort}`);
});
