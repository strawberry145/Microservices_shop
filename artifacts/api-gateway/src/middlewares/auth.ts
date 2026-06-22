import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authClient } from "../lib/grpc";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";

export function authenticate(req: any, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    // Instead of querying the DB directly, we can just use the decoded userId
    // Optionally, you could make a gRPC call to Auth service here to ensure the user still exists:
    authClient.GetMe({ user_id: decoded.userId }, (err: any, response: any) => {
        if (err || !response) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        req.user = { id: response.id, email: response.email, fullName: response.full_name };
        next();
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}
