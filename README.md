# Sole Sanctuary — Women's Shoe Store

A full-stack, event-driven microservices e-commerce platform for women's footwear, built with TypeScript, gRPC, Apache Kafka, and a React frontend.

---

## Table of Contents

1. [Project Overview](#-project-overview)
2. [Main Functionalities](#-main-functionalities)
3. [System Architecture](#-system-architecture)
4. [Technology Stack](#-technology-stack)
5. [Microservices](#-microservices)
6. [API Gateway](#-api-gateway)
7. [Kafka Usage](#-kafka-usage)
8. [Database Design](#-database-design)
9. [End-to-End Flows](#-end-to-end-flows)
10. [Project Structure](#-project-structure)
11. [How to Run the Project](#-how-to-run-the-project)
12. [Possible Future Improvements](#-possible-future-improvements)

---

## Project Overview

**Sole Sanctuary** is a modern women's shoe e-commerce platform built using a **microservices architecture**. The system is designed to be modular, scalable, and resilient, with each business domain handled by an independent, isolated service. Services communicate synchronously via **gRPC** for real-time queries and asynchronously via **Apache Kafka** for event-driven business workflows.

The project demonstrates a real-world distributed system with user authentication, a product catalogue with filtering, an order lifecycle, wishlist management, delivery address management, and real-time inventory management via Kafka events.

---

## Main Functionalities

| Feature | Description |
|---|---|
| **User Authentication** | Secure registration & login with bcrypt password hashing and JWT tokens |
| **Product Catalogue** | Browse, search, and filter shoes by style, brand, heel height, size, colour, and price |
| **Product Details** | View full product details including SKU variants, sizes, colours, and stock levels |
| **Featured / New / Sale Sections** | Dedicated sections for highlighted, new arrival, and discounted products |
| **Shopping Cart** | Add products by SKU, manage quantities before checkout |
| **Order Placement** | Confirm orders linked to a user shipping address |
| **Order History** | View past orders and track their status |
| **Order Cancellation** | Cancel pending or confirmed orders |
| **Wishlist** | Save and manage favourite products |
| **Address Management** | Create, list, and delete shipping addresses |
| **Inventory Management** | Automatic stock decrement via Kafka after each confirmed order |
| **GraphQL API** | Alternative query layer for flexible data fetching |

---

## System Architecture

The system follows a **microservices architecture** with clear separation of concerns:

```
┌──────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
│                  (Vite + React + TanStack Query)                  │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP REST / GraphQL
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│               (Express.js + JWT Auth Middleware)                 │
│          REST API  (/api/...)   │   GraphQL  (/graphql)          │
└──────────┬───────────┬──────────┴──────────┬─────────────────────┘
           │   gRPC    │   gRPC               │  gRPC
           ▼           ▼                      ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ Auth Service │  │Product Serv. │  │ Order Service│
  │  Port 50051  │  │  Port 50052  │  │  Port 50053  │
  │  (SQLite)    │  │  (SQLite)    │  │  (RxDB)      │
  └──────────────┘  └──────┬───────┘  └──────┬───────┘
                           │  Kafka Consumer  │  Kafka Producer
                           │  ◄───────────────┘
                           │     Topic: order.placed
                           ▼
                  ┌─────────────────┐
                  │  Apache Kafka   │
                  │  localhost:9092 │
                  └─────────────────┘
```

**Key architectural principles:**
- **Strong decoupling**: Services do not share a database or call each other directly (except via gRPC or Kafka).
- **Synchronous communication** (gRPC): Used for real-time request/response flows — fetching products, placing orders, user authentication.
- **Asynchronous communication** (Kafka): Used for event-driven side effects — inventory decrement after an order is placed.
- **Single entry point**: All client requests go through the API Gateway, which handles authentication and routing.

---

## Technology Stack

### Backend
| Layer | Technology | Purpose |
|---|---|---|
| Runtime | **Node.js** + **TypeScript** | All services |
| Service-to-Service Communication | **gRPC** (`@grpc/grpc-js`) + **Protobuf** | Synchronous inter-service calls |
| Async Messaging | **Apache Kafka** (`kafkajs`) | Event-driven stock updates |
| API Gateway Framework | **Express.js** | REST API routing & middleware |
| Auth | **bcryptjs** + **jsonwebtoken** | Password hashing & JWT sessions |
| ORM | **Drizzle ORM** | Type-safe database queries |
| Database (Auth & Product) | **SQLite** (via `better-sqlite3`) | Persistent structured storage |
| Database (Order) | **RxDB** | Document-based in-memory storage |
| Validation | **Zod** | Schema validation |
| Logging | **Pino** | Structured JSON logging |
| Package Manager | **pnpm workspaces** | Monorepo management |

### Frontend
| Layer | Technology | Purpose |
|---|---|---|
| Framework | **React 19** + **TypeScript** | UI components |
| Build Tool | **Vite** | Dev server & bundler |
| Styling | **Tailwind CSS v4** | Utility-first styling |
| UI Components | **Radix UI** + **shadcn/ui** | Accessible component primitives |
| State Management | **Zustand** | Global cart state |
| Data Fetching | **TanStack Query (React Query)** | Server state & caching |
| Routing | **Wouter** | Client-side routing |
| Animation | **Framer Motion** | UI animations |
| Icons | **Lucide React** | Icon set |

---

## Microservices

### 1. Auth Microservice (`microservice-auth`)
**Port:** `50051` | **Protocol:** gRPC | **Database:** `auth.db` (SQLite)

Handles all user identity and authentication operations.

| gRPC Method | Description |
|---|---|
| `Register` | Creates a new user account with bcrypt-hashed password, returns a JWT token |
| `Login` | Validates credentials, returns a signed JWT token |
| `GetMe` | Returns the authenticated user's profile by ID |

---

### 2. Product Microservice (`microservice-product`)
**Port:** `50052` | **Protocol:** gRPC + Kafka (Consumer) | **Database:** `product.db` (SQLite)

Manages the entire product catalogue and acts as the **Kafka consumer** for inventory management.

| gRPC Method | Description |
|---|---|
| `ListProducts` | Returns a paginated, filtered list of product summaries |
| `GetProduct` | Returns full product details including SKUs, images, sizes, and colours |
| `GetCatalogueStats` | Returns available filter options (brands, styles, sizes, colours, price range) |
| `GetFeaturedProducts` | Returns products marked as featured |
| `GetNewArrivals` | Returns products marked as new |
| `GetOnSaleProducts` | Returns products with a sale price |

**Kafka role:** Subscribes to `order.placed` topic → decrements `stock_quantity` in the `skus` table.

---

### 3. Order Microservice (`microservice-order`)
**Port:** `50053` | **Protocol:** gRPC + Kafka (Producer) | **Database:** RxDB (in-memory)

Manages orders, wishlists, and delivery addresses. Acts as the **Kafka producer** for order events.

| gRPC Method | Description |
|---|---|
| `PlaceOrder` | Creates a new order, publishes `order.placed` event to Kafka |
| `ListOrders` | Returns a list of order summaries for a user |
| `GetOrder` | Returns full order details including items and shipping address |
| `CancelOrder` | Cancels an order in `pending` or `confirmed` status |
| `GetWishlist` | Returns a user's saved wishlist with product details |
| `AddToWishlist` | Adds a product to the user's wishlist |
| `RemoveFromWishlist` | Removes a product from the wishlist |
| `ListAddresses` | Returns a user's saved delivery addresses |
| `CreateAddress` | Creates a new delivery address |
| `DeleteAddress` | Deletes a delivery address |

---

## API Gateway

**Port:** `3000` | **Framework:** Express.js

The single entry point for all client requests. It authenticates incoming requests via JWT and proxies them to the appropriate microservice via gRPC.

### REST Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/register` | ❌ | Register a new user |
| `POST` | `/api/login` | ❌ | Login and get a JWT token |
| `GET` | `/api/me` | ✅ | Get the authenticated user's profile |
| `GET` | `/api/products` | ❌ | List products with filters |
| `GET` | `/api/products/:id` | ❌ | Get a single product's details |
| `GET` | `/api/products/featured` | ❌ | Get featured products |
| `GET` | `/api/products/new-arrivals` | ❌ | Get new arrivals |
| `GET` | `/api/products/on-sale` | ❌ | Get on-sale products |
| `GET` | `/api/orders` | ✅ | List user's orders |
| `POST` | `/api/orders` | ✅ | Place a new order |
| `GET` | `/api/orders/:id` | ✅ | Get order details |
| `POST` | `/api/orders/:id/cancel` | ✅ | Cancel an order |
| `GET` | `/api/wishlist` | ✅ | Get user's wishlist |
| `POST` | `/api/wishlist` | ✅ | Add product to wishlist |
| `DELETE` | `/api/wishlist/:productId` | ✅ | Remove product from wishlist |
| `GET` | `/api/addresses` | ✅ | List user's addresses |
| `POST` | `/api/addresses` | ✅ | Create a new address |
| `DELETE` | `/api/addresses/:id` | ✅ | Delete an address |

### GraphQL Endpoint
A secondary query interface is available at `/graphql` (with GraphiQL UI for testing in development).

```graphql
type Query {
  products(limit: Int, offset: Int, brand: String, style: String): [Product]
  product(id: Int!): Product
  orders(userId: Int!): [Order]
  me(userId: Int!): User
}
```

---

## 📨 Kafka Usage

Kafka is used for **genuine asynchronous business event processing** — decoupling the Order service from the Product/Inventory service to ensure resilience and eventual consistency.

### Topic: `order.placed`

| Property | Value |
|---|---|
| **Topic** | `order.placed` |
| **Producer** | `microservice-order` (`clientId: order-service`) |
| **Consumer** | `microservice-product` (`groupId: product-group`) |
| **Broker** | `localhost:9092` (configurable via `KAFKA_BROKER` env var) |

#### Message Payload (JSON)
```json
{
  "orderId": 482910,
  "items": [
    { "skuId": 12, "quantity": 1, "unitPrice": 129.99 },
    { "skuId": 47, "quantity": 2, "unitPrice": 89.50 }
  ]
}
```

#### Business Scenario
1. A customer completes checkout and confirms their order.
2. The **Order Microservice** persists the order (status: `pending`) to its database.
3. It **publishes** an `order.placed` event to Kafka containing the order ID and all purchased SKUs with quantities.
4. The **Product Microservice** independently **consumes** this event, then iterates over each item and decrements the `stock_quantity` in the `skus` table of its own database.

#### Why Kafka here?
The Order service does not need to know about the Product service's database to complete its primary responsibility. By publishing an event, the two services remain **fully decoupled**:
- If the Product service is temporarily unavailable, the order is still successfully placed and the Kafka message is retained — the stock will be updated when the service recovers (**eventual consistency**).
- New consumers (e.g., a notification service, an analytics service) can subscribe to the same `order.placed` topic without any changes to the Order service.

---

## Database Design

The system uses two physically separated SQLite databases to enforce the service boundary between authentication and product data.

### `auth.db` — Authentication Database

```
┌─────────────────────────────────────────────┐
│                  users                      │
├──────────────┬──────────────────────────────┤
│ id           │ INTEGER PRIMARY KEY AUTOINCR │
│ email        │ TEXT UNIQUE NOT NULL         │
│ password_hash│ TEXT NOT NULL                │
│ full_name    │ TEXT                         │
│ phone        │ TEXT                         │
│ created_at   │ TEXT (CURRENT_TIMESTAMP)     │
└─────────────────────────────────────────────┘
```

### `product.db` — Product & Inventory Database

```
┌───────────────────────────────────────────────────┐
│                    products                       │
├──────────────┬────────────────────────────────────┤
│ id           │ INTEGER PRIMARY KEY AUTOINCR       │
│ name         │ TEXT NOT NULL                      │
│ description  │ TEXT                               │
│ brand        │ TEXT                               │
│ style        │ TEXT ENUM (sneakers,heels,boots…)  │
│ heel_height  │ TEXT ENUM (flat,low,mid,high,…)    │
│ material     │ TEXT                               │
│ base_price   │ REAL NOT NULL                      │
│ sale_price   │ REAL                               │
│ is_active    │ BOOLEAN DEFAULT true               │
│ is_new       │ BOOLEAN DEFAULT false              │
│ is_featured  │ BOOLEAN DEFAULT false              │
│ created_at   │ TEXT (CURRENT_TIMESTAMP)           │
└──────────────┴────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│                product_images                     │
├──────────────┬────────────────────────────────────┤
│ id           │ INTEGER PRIMARY KEY AUTOINCR       │
│ product_id   │ FK → products.id                   │
│ url          │ TEXT NOT NULL                      │
│ alt_text     │ TEXT                               │
│ is_primary   │ BOOLEAN DEFAULT false              │
│ sort_order   │ INTEGER DEFAULT 0                  │
└──────────────┴────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│                     skus                          │
├──────────────┬────────────────────────────────────┤
│ id           │ INTEGER PRIMARY KEY AUTOINCR       │
│ product_id   │ FK → products.id                   │
│ size_eu      │ REAL NOT NULL                      │
│ size_us      │ REAL                               │
│ size_uk      │ REAL                               │
│ colour       │ TEXT NOT NULL                      │
│ colour_hex   │ TEXT                               │
│ stock_quantity│ INTEGER DEFAULT 0 ← Kafka updates │
│ price_override│ REAL                              │
│ sku_code     │ TEXT UNIQUE NOT NULL               │
└──────────────┴────────────────────────────────────┘
```

### Order Data (RxDB — In-Memory Documents)
The Order service uses RxDB for document-style storage (orders, addresses, wishlists). This data is not persisted to disk between server restarts in the current implementation.

---

## End-to-End Flows

### Flow 1: User Registration & Login
```
Frontend → POST /api/register → API Gateway → gRPC Register → Auth Service
         → bcrypt.hash(password) → INSERT into users → return JWT token
         → Frontend stores JWT in local state
```

### Flow 2: Browse & Filter Products
```
Frontend → GET /api/products?style=heels&brand=Zara → API Gateway
         → gRPC ListProducts → Product Service
         → SELECT from products + skus + images (SQLite)
         → Apply filters & sorting → return paginated list
         → Frontend renders product cards
```

### Flow 3: Place an Order (Full Kafka Flow)
```
1. Frontend → POST /api/orders { items, shippingAddressId }
2. API Gateway (validates JWT) → gRPC PlaceOrder → Order Service
3. Order Service: INSERT order document (RxDB, status: "pending")
4. Order Service: PUBLISH { orderId, items } → Kafka topic "order.placed"
5. Order Service: returns success → API Gateway → Frontend shows confirmation

(Asynchronously, in parallel)
6. Product Service (Kafka Consumer): RECEIVE "order.placed" event
7. Product Service: for each item → UPDATE skus SET stock_quantity = stock_quantity - quantity
```

### Flow 4: View Order History
```
Frontend → GET /api/orders (with JWT)
         → API Gateway authenticates token → gRPC ListOrders → Order Service
         → Query RxDB orders collection (filter by userId)
         → return order summaries → Frontend renders order list
```

---

## Project Structure

```
sole-sanctuary/
│
├── artifacts/                        # All runnable services
│   ├── api-gateway/                  # Express.js API Gateway (port 5000)
│   │   └── src/
│   │       ├── app.ts                # Express app setup (CORS, logging)
│   │       ├── graphql.ts            # GraphQL schema & resolvers
│   │       ├── routes/               # REST route handlers
│   │       │   ├── auth.ts           # /api/register, /api/login, /api/me
│   │       │   ├── products.ts       # /api/products/**
│   │       │   ├── orders.ts         # /api/orders/**
│   │       │   ├── addresses.ts      # /api/addresses/**
│   │       │   └── wishlist.ts       # /api/wishlist/**
│   │       ├── middlewares/
│   │       │   └── auth.ts           # JWT authentication middleware
│   │       └── lib/
│   │           └── grpc.ts           # gRPC client stubs for all services
│   │
│   ├── microservice-auth/            # Auth Service (gRPC port 50051)
│   │   └── src/
│   │       └── index.ts              # Register, Login, GetMe handlers
│   │
│   ├── microservice-product/         # Product Service (gRPC port 50052)
│   │   └── src/
│   │       ├── index.ts              # ListProducts, GetProduct, etc.
│   │       └── kafka.ts              # Kafka Consumer → stock decrement
│   │
│   ├── microservice-order/           # Order Service (gRPC port 50053)
│   │   └── src/
│   │       ├── index.ts              # PlaceOrder, ListOrders, Wishlist, Addresses
│   │       ├── kafka.ts              # Kafka Producer
│   │       ├── db.ts                 # RxDB initialization
│   │       └── grpc-client.ts        # gRPC client to Product Service
│   │
│   └── solehr/                       # React Frontend (Vite, port 5173)
│
├── lib/                              # Shared workspace libraries
│   ├── db/                           # Drizzle ORM schema & database connections
│   │   └── src/schema/
│   │       ├── users.ts              # User table definition
│   │       ├── products.ts           # Products, SKUs, ProductImages tables
│   │       ├── orders.ts             # Orders, OrderItems tables
│   │       ├── addresses.ts          # Addresses table
│   │       └── wishlist.ts           # WishlistItems table
│   ├── protos/                       # Protobuf definitions (gRPC contracts)
│   │   └── src/
│   │       ├── auth.proto            # AuthService contract
│   │       ├── product.proto         # ProductService contract
│   │       └── order.proto           # OrderService contract
│   └── api-spec/                     # API type definitions (Zod schemas)
│
├── auth.db                           # SQLite DB — Auth Service data
├── product.db                        # SQLite DB — Product & Inventory data
├── package.json                      # Root workspace scripts
├── pnpm-workspace.yaml               # pnpm monorepo configuration
└── tsconfig.base.json                # Shared TypeScript configuration
```

---

## How to Run the Project

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | >= 18 | Required for all services |
| **pnpm** | >= 9 | `npm install -g pnpm` |
| **Apache Kafka** | >= 3.x | Must be running locally on `localhost:9092` |

### Step 1: Install Apache Kafka

**Option A — Using Docker (recommended):**
```bash
# Create a docker-compose.yml file with the following content and run it:
docker run -d --name kafka \
  -p 9092:9092 \
  -e KAFKA_CFG_NODE_ID=0 \
  -e KAFKA_CFG_PROCESS_ROLES=controller,broker \
  -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
  -e KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093 \
  -e KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  bitnami/kafka:latest
```

**Option B — Native install:**
Download Apache Kafka from [kafka.apache.org](https://kafka.apache.org/downloads) and start the broker:
```bash
# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# Start Kafka Broker
bin/kafka-server-start.sh config/server.properties
```

### Step 2: Install Dependencies
```bash
# From the project root
pnpm install
```

### Step 3: Run the Project
```bash
# Starts all services in parallel (API Gateway + 3 microservices + Frontend)
pnpm dev
```

All services will start automatically:
| Service | URL / Port |
|---|---|
| **Frontend** | http://localhost:5173 |
| **API Gateway** (REST) | http://localhost:5000/api |
| **API Gateway** (GraphQL) | http://localhost:5000/graphql |
| **Auth Microservice** | gRPC on port `50051` |
| **Product Microservice** | gRPC on port `50052` |
| **Order Microservice** | gRPC on port `50053` |

### Environment Variables (optional)

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `super-secret-key-for-dev` | Secret for signing JWT tokens |
| `KAFKA_BROKER` | `localhost:9092` | Kafka broker address |
| `AUTH_PORT` | `50051` | Auth service gRPC port |
| `PRODUCT_PORT` | `50052` | Product service gRPC port |
| `ORDER_PORT` | `50053` | Order service gRPC port |

---

## Possible Future Improvements

### Architecture & Infrastructure
- **Docker Compose** — Containerize all services and Kafka with a single `docker-compose up` command for reproducible deployments.
- **Kubernetes** — Deploy to a K8s cluster with horizontal scaling for high-traffic services.
- **API Gateway rate limiting** — Add rate limiting and request throttling to prevent abuse.
- **Service discovery** — Introduce a service registry (e.g., Consul) instead of hardcoded ports.

### Kafka & Messaging
- **Dead Letter Queue (DLQ)** — Route failed Kafka messages to a DLQ for manual inspection and reprocessing.
- **Additional Topics** — Add events such as `order.shipped`, `order.cancelled` to trigger email notifications or analytics pipelines.
- **Notification Service** — A new microservice that consumes order events to send email/SMS confirmations to customers.

### Business Features
- **Payment Integration** — Integrate Stripe or a similar payment gateway before finalizing an order.
- **Order Tracking** — Real-time order status updates with tracking number integration.
- **Product Reviews & Ratings** — Allow customers to leave reviews on purchased products.
- **Admin Dashboard** — A back-office interface for managing products, stock levels, and order statuses.
- **Promotions & Discount Codes** — Support for coupon codes and promotional pricing.

### Technical Improvements
- **Persistent Order Storage** — Replace RxDB with a proper SQLite/PostgreSQL database for the Order service so data is not lost on restart.
- **End-to-End Testing** — Add integration tests covering the full gRPC → Kafka → DB flow.
- **CI/CD Pipeline** — Automated build, test, and deployment pipeline via GitHub Actions.
- **OpenTelemetry** — Distributed tracing across all microservices for observability.
