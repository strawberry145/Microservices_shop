import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { logger } from './lib/logger';
import { dbAuth as db, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import url from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../../../lib/protos/src/auth.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const authProto = grpc.loadPackageDefinition(packageDefinition).auth as any;

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";

const server = new grpc.Server();

server.addService(authProto.AuthService.service, {
  Register: async (call: any, callback: any) => {
    try {
      const { email, password, full_name } = call.request;
      
      const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (existingUser.length > 0) {
        callback({ code: grpc.status.ALREADY_EXISTS, message: "Email already registered" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [user] = await db.insert(usersTable).values({
        email,
        passwordHash,
        fullName: full_name,
      }).returning();

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      callback(null, {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          phone: user.phone,
          created_at: new Date(user.createdAt).toISOString()
        }
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },
  
  Login: async (call: any, callback: any) => {
    try {
      const { email, password } = call.request;
      
      const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (!user) {
        callback({ code: grpc.status.UNAUTHENTICATED, message: "Invalid email or password" });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        callback({ code: grpc.status.UNAUTHENTICATED, message: "Invalid email or password" });
        return;
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      callback(null, {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          phone: user.phone,
          created_at: new Date(user.createdAt).toISOString()
        }
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  },

  GetMe: async (call: any, callback: any) => {
    try {
      const { user_id } = call.request;
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, user_id)).limit(1);
      
      if (!user) {
        callback({ code: grpc.status.NOT_FOUND, message: "User not found" });
        return;
      }
      
      callback(null, {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        phone: user.phone,
        created_at: new Date(user.createdAt).toISOString()
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: (error as Error).message });
    }
  }
});

const port = Number(process.env["AUTH_PORT"]) || 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    logger.error(err);
    return;
  }
  logger.info(`Auth gRPC Microservice listening on port ${boundPort}`);
});
