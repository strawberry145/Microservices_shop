import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// Load proto files
const PROTO_PATH_AUTH = path.resolve(__dirname, '../../../lib/protos/src/auth.proto');
const PROTO_PATH_PRODUCT = path.resolve(__dirname, '../../../lib/protos/src/product.proto');
const PROTO_PATH_ORDER = path.resolve(__dirname, '../../../lib/protos/src/order.proto');

const packageDefinitionAuth = protoLoader.loadSync(PROTO_PATH_AUTH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const packageDefinitionProduct = protoLoader.loadSync(PROTO_PATH_PRODUCT, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const packageDefinitionOrder = protoLoader.loadSync(PROTO_PATH_ORDER, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });

const authProto = grpc.loadPackageDefinition(packageDefinitionAuth).auth as any;
const productProto = grpc.loadPackageDefinition(packageDefinitionProduct).product as any;
const orderProto = grpc.loadPackageDefinition(packageDefinitionOrder).order as any;

// These will point to the future microservices
// For now they are placeholders. Once we build the microservices in Step 3, these will be active.
export const authClient = new authProto.AuthService('localhost:50051', grpc.credentials.createInsecure());
export const productClient = new productProto.ProductService('localhost:50052', grpc.credentials.createInsecure());
export const orderClient = new orderProto.OrderService('localhost:50053', grpc.credentials.createInsecure());
