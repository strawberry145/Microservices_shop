import { dbAuth, dbProduct, usersTable, productsTable, productImagesTable, skusTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const BRANDS = ["Velara", "Luxestep", "NoveFoot", "Stride & Grace", "Orla"];

const EU_SIZES = [35, 36, 37, 38, 39, 40, 41, 42];
const EU_TO_US: Record<number, number> = { 35: 5, 36: 6, 37: 7, 38: 8, 39: 9, 40: 10, 41: 11, 42: 12 };
const EU_TO_UK: Record<number, number> = { 35: 2.5, 36: 3.5, 37: 4.5, 38: 5.5, 39: 6.5, 40: 7.5, 41: 8.5, 42: 9.5 };

const PRODUCTS = [
  { name: "Rosette Kitten Heel", brand: "Velara", style: "heels" as const, heelHeight: "low" as const, material: "Satin", basePrice: "89.00", salePrice: null, description: "A classic kitten heel in soft satin, perfect for day-to-night dressing.", isNew: true, isFeatured: true, colours: [{ name: "Blush", hex: "#F2C2C2" }, { name: "Ivory", hex: "#FFFFF0" }, { name: "Champagne", hex: "#D4AF81" }] },
  { name: "Midnight Stiletto", brand: "Luxestep", style: "heels" as const, heelHeight: "high" as const, material: "Patent Leather", basePrice: "189.00", salePrice: null, description: "An iconic stiletto in high-gloss patent leather. Polished, powerful, unforgettable.", isNew: false, isFeatured: true, colours: [{ name: "Black", hex: "#1A1A1A" }, { name: "Red", hex: "#C0392B" }, { name: "Nude", hex: "#D4A96A" }] },
  { name: "Canyon Combat Boot", brand: "NoveFoot", style: "boots" as const, heelHeight: "flat" as const, material: "Genuine Leather", basePrice: "149.00", salePrice: "119.00", description: "Rugged yet refined — this leather combat boot pairs effortlessly with everything.", isNew: false, isFeatured: true, colours: [{ name: "Cognac", hex: "#9B5523" }, { name: "Black", hex: "#1A1A1A" }] },
  { name: "Cloud Runner Sneaker", brand: "Stride & Grace", style: "sneakers" as const, heelHeight: "flat" as const, material: "Mesh & Foam", basePrice: "79.00", salePrice: null, description: "Ultra-lightweight runners with responsive foam — like running on clouds.", isNew: true, isFeatured: true, colours: [{ name: "White", hex: "#FAFAFA" }, { name: "Sage", hex: "#8FAF8B" }, { name: "Lavender", hex: "#B0A0D0" }] },
  { name: "Amalfi Strappy Sandal", brand: "Velara", style: "sandals" as const, heelHeight: "mid" as const, material: "Suede", basePrice: "129.00", salePrice: null, description: "Mediterranean-inspired strappy sandal in butter-soft suede.", isNew: true, isFeatured: false, colours: [{ name: "Camel", hex: "#C19A6B" }, { name: "Terracotta", hex: "#CB7356" }, { name: "White", hex: "#F5F5F0" }] },
  { name: "Penelope Loafer", brand: "Orla", style: "loafers" as const, heelHeight: "flat" as const, material: "Calfskin Leather", basePrice: "159.00", salePrice: null, description: "A heritage loafer updated for the modern wardrobe. Structured, polished, versatile.", isNew: false, isFeatured: true, colours: [{ name: "Tan", hex: "#C6924B" }, { name: "Black", hex: "#1A1A1A" }, { name: "Burgundy", hex: "#800020" }] },
  { name: "Platform Chelsea Boot", brand: "Luxestep", style: "boots" as const, heelHeight: "platform" as const, material: "Vegetan Leather", basePrice: "219.00", salePrice: "179.00", description: "Chunky platform chelsea with sculpted sole — bold and architectural.", isNew: false, isFeatured: true, colours: [{ name: "Black", hex: "#1A1A1A" }, { name: "Off-White", hex: "#F5F5F0" }] },
  { name: "Riviera Flat Sandal", brand: "NoveFoot", style: "sandals" as const, heelHeight: "flat" as const, material: "Leather", basePrice: "49.00", salePrice: "29.00", description: "Simple, versatile, endlessly wearable. The flat sandal you'll reach for every day.", isNew: false, isFeatured: false, colours: [{ name: "Tan", hex: "#C6924B" }, { name: "Gold", hex: "#CFB53B" }, { name: "Silver", hex: "#C0C0C0" }] },
  { name: "Sculptural Mule", brand: "Velara", style: "mules" as const, heelHeight: "mid" as const, material: "Leather", basePrice: "109.00", salePrice: null, description: "Architectural mule with a carved block heel. Minimal, striking, considered.", isNew: true, isFeatured: false, colours: [{ name: "Stone", hex: "#9B9189" }, { name: "Black", hex: "#1A1A1A" }] },
  { name: "Ballerina Flat", brand: "Orla", style: "flats" as const, heelHeight: "flat" as const, material: "Satin", basePrice: "69.00", salePrice: null, description: "The perfect ballet flat — precise construction, whisper-soft lining.", isNew: true, isFeatured: false, colours: [{ name: "Blush", hex: "#F2C2C2" }, { name: "Black", hex: "#1A1A1A" }, { name: "Navy", hex: "#1B2A4A" }, { name: "Red", hex: "#C0392B" }] },
  { name: "Altitude Platform Heel", brand: "Luxestep", style: "platforms" as const, heelHeight: "platform" as const, material: "Faux Suede", basePrice: "139.00", salePrice: null, description: "Sky-high platform heel with thick outsole and padded ankle strap. Drama, delivered.", isNew: false, isFeatured: false, colours: [{ name: "Black", hex: "#1A1A1A" }, { name: "Caramel", hex: "#C19A6B" }] },
  { name: "Trek Ankle Boot", brand: "Stride & Grace", style: "boots" as const, heelHeight: "low" as const, material: "Waterproof Nubuck", basePrice: "169.00", salePrice: null, description: "All-weather ankle boot built for the city. Waterproof nubuck, lug sole.", isNew: true, isFeatured: false, colours: [{ name: "Chocolate", hex: "#5C3317" }, { name: "Charcoal", hex: "#555555" }] },
  { name: "Capri Wedge Sandal", brand: "NoveFoot", style: "sandals" as const, heelHeight: "mid" as const, material: "Raffia & Leather", basePrice: "99.00", salePrice: "75.00", description: "Espadrille-inspired wedge sandal woven in natural raffia with leather trim.", isNew: false, isFeatured: false, colours: [{ name: "Natural", hex: "#D4B896" }, { name: "Rust", hex: "#B7410E" }] },
  { name: "Monogram Court Heel", brand: "Orla", style: "heels" as const, heelHeight: "mid" as const, material: "Canvas & Leather", basePrice: "249.00", salePrice: null, description: "Signature Orla monogram canvas court heel with leather trim. Investment dressing.", isNew: false, isFeatured: true, colours: [{ name: "Beige", hex: "#E8D5B0" }, { name: "Black", hex: "#1A1A1A" }] },
  { name: "Neon Training Shoe", brand: "Stride & Grace", style: "sneakers" as const, heelHeight: "flat" as const, material: "Knit Upper", basePrice: "85.00", salePrice: null, description: "Performance training shoe in bold colourways with adaptive knit upper.", isNew: true, isFeatured: false, colours: [{ name: "Coral", hex: "#FF6B6B" }, { name: "Electric Blue", hex: "#0F52BA" }, { name: "Lime", hex: "#32CD32" }] },
  { name: "Slingback Block Heel", brand: "Velara", style: "heels" as const, heelHeight: "mid" as const, material: "Leather", basePrice: "115.00", salePrice: null, description: "Polished slingback with a wide block heel. Comfortable enough to wear all day.", isNew: false, isFeatured: false, colours: [{ name: "Ivory", hex: "#FFFFF0" }, { name: "Blush", hex: "#F2C2C2" }, { name: "Black", hex: "#1A1A1A" }] },
  { name: "Knee-High Leather Boot", brand: "Luxestep", style: "boots" as const, heelHeight: "mid" as const, material: "Full-Grain Leather", basePrice: "299.00", salePrice: "229.00", description: "Luxurious knee-high boot in full-grain leather with inside zip and leather sole.", isNew: false, isFeatured: true, colours: [{ name: "Black", hex: "#1A1A1A" }, { name: "Dark Brown", hex: "#3B1C0A" }] },
  { name: "Penny Loafer Mule", brand: "NoveFoot", style: "mules" as const, heelHeight: "flat" as const, material: "Leather", basePrice: "89.00", salePrice: null, description: "The classic penny loafer reimagined as an open-back mule. Relaxed but sharp.", isNew: true, isFeatured: false, colours: [{ name: "Tan", hex: "#C6924B" }, { name: "Black", hex: "#1A1A1A" }] },
  { name: "Brogue Oxford Flat", brand: "Orla", style: "flats" as const, heelHeight: "flat" as const, material: "Leather", basePrice: "135.00", salePrice: null, description: "Feminine take on the classic brogue — perforated detailing, leather sole.", isNew: false, isFeatured: false, colours: [{ name: "Oxblood", hex: "#4A0018" }, { name: "Tan", hex: "#C6924B" }, { name: "Black", hex: "#1A1A1A" }] },
  { name: "Sunset Heeled Sandal", brand: "Luxestep", style: "heels" as const, heelHeight: "high" as const, material: "Suede", basePrice: "175.00", salePrice: null, description: "Strappy suede heeled sandal with stiletto heel. Statement evening wear.", isNew: true, isFeatured: true, colours: [{ name: "Caramel", hex: "#C19A6B" }, { name: "Blush", hex: "#F2C2C2" }, { name: "Black", hex: "#1A1A1A" }] },
];

const IMG_BASE = "https://images.unsplash.com/photo-";
const PRODUCT_IMAGES: Record<number, string[]> = {
  0: ["1543163521-1bf539c55dd2?w=800", "1515347850832-d8d3f7523b8e?w=800", "1553062407-98eeb64c6a62?w=800"],
  1: ["1515347850832-d8d3f7523b8e?w=800", "1543163521-1bf539c55dd2?w=800"],
  2: ["1605812276723-9b1f3e1de08a?w=800", "1542291026-7eec264c27ff?w=800"],
  3: ["1542291026-7eec264c27ff?w=800", "1460355976672-d08b4fd63e6a?w=800"],
  4: ["1539635038596-b68f5551d4f7?w=800", "1525171254930-643fc658b64e?w=800"],
  5: ["1549298916-b41d501d3772?w=800", "1543163521-1bf539c55dd2?w=800"],
  6: ["1603808033192-082e1f745c32?w=800", "1605812276723-9b1f3e1de08a?w=800"],
  7: ["1525171254930-643fc658b64e?w=800", "1539635038596-b68f5551d4f7?w=800"],
  8: ["1515347850832-d8d3f7523b8e?w=800", "1543163521-1bf539c55dd2?w=800"],
  9: ["1553062407-98eeb64c6a62?w=800", "1543163521-1bf539c55dd2?w=800"],
  10: ["1603808033192-082e1f745c32?w=800", "1605812276723-9b1f3e1de08a?w=800"],
  11: ["1605812276723-9b1f3e1de08a?w=800", "1542291026-7eec264c27ff?w=800"],
  12: ["1525171254930-643fc658b64e?w=800", "1539635038596-b68f5551d4f7?w=800"],
  13: ["1549298916-b41d501d3772?w=800", "1543163521-1bf539c55dd2?w=800"],
  14: ["1460355976672-d08b4fd63e6a?w=800", "1542291026-7eec264c27ff?w=800"],
  15: ["1543163521-1bf539c55dd2?w=800", "1515347850832-d8d3f7523b8e?w=800"],
  16: ["1603808033192-082e1f745c32?w=800", "1605812276723-9b1f3e1de08a?w=800"],
  17: ["1549298916-b41d501d3772?w=800", "1543163521-1bf539c55dd2?w=800"],
  18: ["1553062407-98eeb64c6a62?w=800", "1543163521-1bf539c55dd2?w=800"],
  19: ["1539635038596-b68f5551d4f7?w=800", "1525171254930-643fc658b64e?w=800"],
};

async function seed() {
  console.log("Seeding started...");

  // Delete existing data
  await dbAuth.delete(usersTable);
  await dbProduct.delete(productImagesTable);
  await dbProduct.delete(skusTable);
  await dbProduct.delete(productsTable);

  console.log("Deleted existing data");

  // Create users
  const passwordHash = await bcrypt.hash("password123", 10);
  try {
    await dbAuth
      .insert(usersTable)
      .values([
        { email: "test@solehr.com", passwordHash, fullName: "Sophie Laurent", phone: "+44 7700 900001" },
        { email: "admin@solehr.com", passwordHash, fullName: "Admin User", phone: "+44 7700 900002" },
      ])
      .onConflictDoNothing({ target: usersTable.email });
  } catch (err: any) {
    console.error("Error inserting users:", err.message);
  }

  console.log("✅ Users seeded");

  // Seed products
  const insertedProductIds: number[] = [];

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const [product] = await dbProduct
      .insert(productsTable)
      .values({
        name: p.name,
        brand: p.brand,
        style: p.style,
        heelHeight: p.heelHeight,
        material: p.material,
        basePrice: parseFloat(p.basePrice),
        salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
        description: p.description,
        isNew: p.isNew,
        isFeatured: p.isFeatured,
        isActive: true,
        category: p.style,
      })
      .returning();

    insertedProductIds.push(product.id);

    // Insert images
    const imgKeys = PRODUCT_IMAGES[i] ?? PRODUCT_IMAGES[0];
    await dbProduct.insert(productImagesTable).values(
      imgKeys.map((key, j) => ({
        productId: product.id,
        url: `${IMG_BASE}${key}`,
        altText: `${p.name} - view ${j + 1}`,
        isPrimary: j === 0,
        sortOrder: j,
      }))
    );

    // Insert SKUs: 3-4 colours × EU sizes 35-42
    for (const colour of p.colours) {
      for (const sizeEu of EU_SIZES) {
        const stock = Math.random() < 0.1 ? 0 : Math.random() < 0.15 ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 20) + 5;
        try {
          await dbProduct.insert(skusTable).values({
            productId: product.id,
            sizeEu: sizeEu,
            sizeUs: EU_TO_US[sizeEu] || null,
            sizeUk: EU_TO_UK[sizeEu] || null,
            colour: colour.name,
            colourHex: colour.hex,
            stockQuantity: stock,
            skuCode: `${p.brand.replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 3)}-${product.id}-${colour.name.replace(/\s+/g, "").toUpperCase().slice(0, 4)}-${sizeEu}`,
          }).onConflictDoNothing({ target: skusTable.skuCode });
        } catch (err: any) {
         console.error("Error inserting sku:", err.message);
      }
      }
    }
  }

  console.log(`✅ ${PRODUCTS.length} products seeded`);


  console.log("🎉 Seeding complete!");
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
