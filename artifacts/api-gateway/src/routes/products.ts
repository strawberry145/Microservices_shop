import { Router } from "express";
import { productClient } from "../lib/grpc";

const router = Router();

router.get("/products", (req, res): void => {
  productClient.ListProducts({
    style: req.query.style,
    heel_height: req.query.heelHeight,
    brand: req.query.brand,
    min_price: req.query.minPrice,
    max_price: req.query.maxPrice,
    size_eu: req.query.sizeEu ? Number(req.query.sizeEu) : undefined,
    colour: req.query.colour,
    search: req.query.search,
    sort: req.query.sort,
    limit: req.query.limit ? Number(req.query.limit) : 24,
    offset: req.query.offset ? Number(req.query.offset) : 0,
  }, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({
      total: response.total,
      limit: response.limit,
      offset: response.offset,
      items: response.items ? response.items.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        style: p.style,
        heelHeight: p.heel_height,
        basePrice: p.base_price,
        minPrice: p.min_price,
        maxPrice: p.max_price,
        salePrice: p.sale_price,
        primaryImage: p.primary_image,
        colourCount: p.colour_count,
        isNew: p.is_new,
        isFeatured: p.is_featured,
      })) : []
    });
  });
});

router.get("/products/featured", (req, res): void => {
  productClient.GetFeaturedProducts(req.query, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(response.items ? response.items.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        style: p.style,
        heelHeight: p.heel_height,
        basePrice: p.base_price,
        minPrice: p.min_price,
        maxPrice: p.max_price,
        salePrice: p.sale_price,
        primaryImage: p.primary_image,
        colourCount: p.colour_count,
        isNew: p.is_new,
        isFeatured: p.is_featured,
    })) : []);
  });
});

router.get("/products/new-arrivals", (req, res): void => {
  productClient.GetNewArrivals(req.query, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(response.items ? response.items.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        style: p.style,
        heelHeight: p.heel_height,
        basePrice: p.base_price,
        minPrice: p.min_price,
        maxPrice: p.max_price,
        salePrice: p.sale_price,
        primaryImage: p.primary_image,
        colourCount: p.colour_count,
        isNew: p.is_new,
        isFeatured: p.is_featured,
    })) : []);
  });
});

router.get("/products/on-sale", (req, res): void => {
  productClient.GetOnSaleProducts(req.query, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(response.items ? response.items.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        style: p.style,
        heelHeight: p.heel_height,
        basePrice: p.base_price,
        minPrice: p.min_price,
        maxPrice: p.max_price,
        salePrice: p.sale_price,
        primaryImage: p.primary_image,
        colourCount: p.colour_count,
        isNew: p.is_new,
        isFeatured: p.is_featured,
    })) : []);
  });
});

router.get("/products/catalogue-stats", (_req, res): void => {
  productClient.GetCatalogueStats({}, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
        brands: response.brands || [],
        styles: response.styles || [],
        heelHeights: response.heel_heights || [],
        availableSizes: response.available_sizes || [],
        colours: response.colours || [],
        minPrice: response.min_price,
        maxPrice: response.max_price
    });
  });
});

router.get("/products/:id", (req, res): void => {
  productClient.GetProduct({ id: Number(req.params.id) }, (err: any, response: any) => {
    if (err) {
      if (err.code === 5) { // NOT_FOUND
        res.status(404).json({ error: "Product not found" });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    
    res.json({
        id: response.id,
        name: response.name,
        brand: response.brand,
        description: response.description,
        style: response.style,
        heelHeight: response.heel_height,
        material: response.material,
        basePrice: response.base_price,
        category: response.category,
        isActive: response.is_active,
        isNew: response.is_new,
        isFeatured: response.is_featured,
        images: response.images ? response.images.map((i: any) => ({
            id: i.id, url: i.url, altText: i.alt_text, isPrimary: i.is_primary, sortOrder: i.sort_order
        })) : [],
        skus: response.skus ? response.skus.map((s: any) => ({
            id: s.id, productId: s.product_id, sizeEu: s.size_eu, sizeUs: s.size_us, sizeUk: s.size_uk,
            colour: s.colour, colourHex: s.colour_hex, stockQuantity: s.stock_quantity, price: s.price, skuCode: s.sku_code
        })) : []
    });
  });
});

export default router;
