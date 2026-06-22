import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH_PRODUCT = path.resolve(__dirname, '../../../lib/protos/src/product.proto');
const packageDefinitionProduct = protoLoader.loadSync(PROTO_PATH_PRODUCT, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const productProto = grpc.loadPackageDefinition(packageDefinitionProduct).product as any;

export const productClient = new productProto.ProductService('localhost:50052', grpc.credentials.createInsecure());
