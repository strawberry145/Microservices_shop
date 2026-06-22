import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { productClient, orderClient, authClient } from './lib/grpc';

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Product {
    id: Int!
    name: String!
    brand: String
    style: String!
    heelHeight: String
    basePrice: Float!
    salePrice: Float
    primaryImage: String
    isNew: Boolean
    isFeatured: Boolean
  }

  type OrderItem {
    skuId: Int!
    quantity: Int!
    unitPrice: Float!
  }

  type Order {
    id: Int!
    status: String!
    total: Float!
    trackingNumber: String
    createdAt: String!
    items: [OrderItem]
  }

  type User {
    id: Int!
    email: String!
    fullName: String!
    role: String!
  }

  type Query {
    products(limit: Int, offset: Int, brand: String, style: String): [Product]
    product(id: Int!): Product
    orders(userId: Int!): [Order]
    me(userId: Int!): User
  }
`);

// The root provides a resolver function for each API endpoint
const root = {
  products: (args: any) => {
    return new Promise((resolve, reject) => {
      const gRpcQuery = {
        limit: args.limit || 24,
        offset: args.offset || 0,
        brand: args.brand,
        style: args.style
      };
      
      productClient.ListProducts(gRpcQuery, (err: any, response: any) => {
        if (err) return reject(err);
        
        const items = response.items ? response.items.map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          style: p.style,
          heelHeight: p.heel_height,
          basePrice: p.base_price,
          salePrice: p.sale_price,
          primaryImage: p.primary_image,
          isNew: p.is_new,
          isFeatured: p.is_featured,
        })) : [];
        resolve(items);
      });
    });
  },
  
  product: (args: any) => {
    return new Promise((resolve, reject) => {
      productClient.GetProduct({ id: args.id }, (err: any, response: any) => {
        if (err) return reject(err);
        resolve({
          id: response.id,
          name: response.name,
          brand: response.brand,
          style: response.style,
          heelHeight: response.heel_height,
          basePrice: response.base_price,
          salePrice: response.sale_price,
          primaryImage: response.images?.[0]?.url || null,
          isNew: response.is_new,
          isFeatured: response.is_featured,
        });
      });
    });
  },

  orders: (args: any, context: any) => {
    // In a real app, verify context.user.id == args.userId
    return new Promise((resolve, reject) => {
      orderClient.ListOrders({ user_id: args.userId }, (err: any, response: any) => {
        if (err) return reject(err);
        
        const items = response.items ? response.items.map((o: any) => ({
          id: o.id,
          status: o.status,
          total: o.total,
          trackingNumber: o.tracking_number,
          createdAt: o.created_at,
          items: [] // Simplified for list
        })) : [];
        resolve(items);
      });
    });
  },

  me: (args: any) => {
    return new Promise((resolve, reject) => {
      authClient.GetMe({ user_id: args.userId }, (err: any, response: any) => {
        if (err) return reject(err);
        resolve({
          id: response.id,
          email: response.email,
          fullName: response.full_name,
          role: response.role
        });
      });
    });
  }
};

export const graphqlMiddleware = graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true, // Enables the GraphiQL UI for testing
});
