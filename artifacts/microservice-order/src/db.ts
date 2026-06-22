import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

addRxPlugin(RxDBQueryBuilderPlugin);

const orderSchema = {
    title: 'order schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        userId: { type: 'number' },
        status: { type: 'string' },
        total: { type: 'number' },
        trackingNumber: { type: 'string' },
        carrier: { type: 'string' },
        estimatedDelivery: { type: 'string' },
        notes: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        shippingAddress: {
            type: 'object',
            properties: {
                id: { type: 'number' },
                label: { type: 'string' },
                street: { type: 'string' },
                city: { type: 'string' },
                country: { type: 'string' },
                postalCode: { type: 'string' },
                isDefault: { type: 'boolean' }
            }
        },
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    skuId: { type: 'number' },
                    quantity: { type: 'number' },
                    unitPrice: { type: 'number' }
                }
            }
        }
    },
    required: ['id', 'userId', 'status', 'total', 'createdAt', 'items']
};

const addressSchema = {
    title: 'address schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        userId: { type: 'number' },
        label: { type: 'string' },
        street: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        postalCode: { type: 'string' },
        isDefault: { type: 'boolean' }
    },
    required: ['id', 'userId', 'label', 'street', 'city', 'country', 'postalCode']
};

const wishlistSchema = {
    title: 'wishlist schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        userId: { type: 'number' },
        productId: { type: 'number' },
        addedAt: { type: 'string' }
    },
    required: ['id', 'userId', 'productId', 'addedAt']
};

let dbPromise: any = null;

export const getDb = async () => {
    if (dbPromise) return dbPromise;

    dbPromise = createRxDatabase({
        name: 'orderdb',
        storage: getRxStorageMemory()
    }).then(async db => {
        await db.addCollections({
            orders: { schema: orderSchema },
            addresses: { schema: addressSchema },
            wishlists: { schema: wishlistSchema }
        });
        return db;
    });

    return dbPromise;
};
