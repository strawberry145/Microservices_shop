import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";
import { addressesTable } from "./addresses";
import { skusTable } from "./products";

export const ordersTable = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"] }).default("pending").notNull(),
  total: real("total").notNull(),
  shippingAddressId: integer("shipping_address_id").references(() => addressesTable.id),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  notes: text("notes"),
  estimatedDelivery: text("estimated_delivery"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const orderItemsTable = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => ordersTable.id).notNull(),
  skuId: integer("sku_id").references(() => skusTable.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
