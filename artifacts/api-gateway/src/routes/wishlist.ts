import { Router } from "express";
import { orderClient } from "../lib/grpc";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.get("/wishlist", (req: any, res: any): void => {
  orderClient.GetWishlist({ user_id: req.user.id }, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(response.items ? response.items.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      addedAt: item.added_at,
      product: {
        id: item.product.id, name: item.product.name, brand: item.product.brand, style: item.product.style,
        heelHeight: item.product.heel_height, basePrice: item.product.base_price, minPrice: item.product.min_price,
        maxPrice: item.product.max_price, salePrice: item.product.sale_price, primaryImage: item.product.primary_image,
        colourCount: item.product.colour_count, isNew: item.product.is_new, isFeatured: item.product.is_featured
      }
    })) : []);
  });
});

router.post("/wishlist", (req: any, res: any): void => {
  orderClient.AddToWishlist({ user_id: req.user.id, product_id: req.body.productId }, (err: any, response: any) => {
    if (err) {
      if (err.code === 6) { // ALREADY_EXISTS
        res.status(400).json({ error: "Product already in wishlist" });
      } else if (err.code === 5) { // NOT_FOUND
        res.status(404).json({ error: "Product not found" });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.status(201).json({
      id: response.id,
      productId: response.product_id,
      addedAt: response.added_at
    });
  });
});

router.delete("/wishlist/:productId", (req: any, res: any): void => {
  orderClient.RemoveFromWishlist({ user_id: req.user.id, product_id: Number(req.params.productId) }, (err: any, _response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(204).send();
  });
});

export default router;
