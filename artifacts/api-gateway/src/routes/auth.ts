import { Router } from "express";
import { authClient } from "../lib/grpc";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/register", (req, res): void => {
  const { email, password, fullName } = req.body;
  authClient.Register({ email, password, full_name: fullName }, (err: any, response: any) => {
    if (err) {
      if (err.code === 6) { // ALREADY_EXISTS
        res.status(400).json({ error: "Email already registered" });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.status(201).json(response);
  });
});

router.post("/login", (req, res): void => {
  const { email, password } = req.body;
  authClient.Login({ email, password }, (err: any, response: any) => {
    if (err) {
      if (err.code === 16) { // UNAUTHENTICATED
        res.status(401).json({ error: "Invalid email or password" });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.json(response);
  });
});

router.get("/me", (req, res): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    authClient.GetMe({ user_id: decoded.userId }, (err: any, response: any) => {
      if (err) {
        if (err.code === 5) { // NOT_FOUND
          res.status(404).json({ error: "User not found" });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }
      res.json({
        id: response.id,
        email: response.email,
        fullName: response.full_name,
        phone: response.phone,
        createdAt: response.created_at
      });
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
