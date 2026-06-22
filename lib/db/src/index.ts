import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbUrl = process.env.DATABASE_URL || `file:${path.join(__dirname, "../../../sqlite.db")}`;

const authUrl = process.env.DATABASE_URL_AUTH || `file:${path.join(__dirname, "../../../auth.db")}`;
export const authClient = createClient({
  url: authUrl,
});
export const dbAuth = drizzle(authClient, { schema });

const productUrl = process.env.DATABASE_URL_PRODUCT || `file:${path.join(__dirname, "../../../product.db")}`;
const productClient = createClient({
  url: productUrl,
});
export const dbProduct = drizzle(productClient, { schema });

export * from "./schema";
