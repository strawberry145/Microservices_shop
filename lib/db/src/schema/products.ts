import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

const styles = ["sneakers", "heels", "boots", "sandals", "loafers", "flats", "platforms", "mules"] as const;
const heelHeights = ["flat", "low", "mid", "high", "platform"] as const;

export const productsTable = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  brand: text("brand"),
  style: text("style", { enum: styles }).notNull(),
  heelHeight: text("heel_height", { enum: heelHeights }),
  material: text("material"),
  basePrice: real("base_price").notNull(),
  salePrice: real("sale_price"),
  category: text("category"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  isNew: integer("is_new", { mode: "boolean" }).default(false).notNull(),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const productImagesTable = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => productsTable.id).notNull(),
  url: text("url").notNull(),
  altText: text("alt_text"),
  isPrimary: integer("is_primary", { mode: "boolean" }).default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const skusTable = sqliteTable("skus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => productsTable.id).notNull(),
  sizeEu: real("size_eu").notNull(),
  sizeUs: real("size_us"),
  sizeUk: real("size_uk"),
  colour: text("colour").notNull(),
  colourHex: text("colour_hex"),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  priceOverride: real("price_override"),
  skuCode: text("sku_code").notNull().unique(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export const insertSkuSchema = createInsertSchema(skusTable).omit({ id: true });
export const insertProductImageSchema = createInsertSchema(productImagesTable).omit({ id: true });

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
export type SKU = typeof skusTable.$inferSelect;
export type ProductImage = typeof productImagesTable.$inferSelect;
