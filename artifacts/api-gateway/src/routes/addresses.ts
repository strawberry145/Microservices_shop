import { Router } from "express";
import { orderClient } from "../lib/grpc";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.get("/addresses", (req: any, res: any): void => {
  orderClient.ListAddresses({ user_id: req.user.id }, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(response.items ? response.items.map((item: any) => ({
      id: item.id, label: item.label, street: item.street, city: item.city,
      country: item.country, postalCode: item.postal_code, isDefault: item.is_default
    })) : []);
  });
});

router.post("/addresses", (req: any, res: any): void => {
  const { label, street, city, country, postalCode, isDefault } = req.body;
  orderClient.CreateAddress({ 
    user_id: req.user.id, label, street, city, country, postal_code: postalCode, is_default: isDefault 
  }, (err: any, response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      id: response.id, label: response.label, street: response.street, city: response.city,
      country: response.country, postalCode: response.postal_code, isDefault: response.is_default
    });
  });
});

router.delete("/addresses/:id", (req: any, res: any): void => {
  orderClient.DeleteAddress({ user_id: req.user.id, address_id: Number(req.params.id) }, (err: any, _response: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(204).send();
  });
});

export default router;
