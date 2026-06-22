import { Kafka } from 'kafkajs';
import { dbProduct as db, skusTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const kafka = new Kafka({
  clientId: 'product-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

export const consumer = kafka.consumer({ groupId: 'product-group' });

export const connectKafkaConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'order.placed', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        const event = JSON.parse(message.value.toString());
        
        console.log(`\n📥 [Kafka] Received ${topic} event! Order ID: ${event.orderId}`);
        
        if (topic === 'order.placed') {
          // Reduce stock for each item
          for (const item of event.items) {
             const [sku] = await db.select().from(skusTable).where(eq(skusTable.id, item.skuId)).limit(1);
             if (sku) {
                 const newStock = Math.max(0, sku.stockQuantity - item.quantity);
                 await db.update(skusTable).set({ stockQuantity: newStock }).where(eq(skusTable.id, item.skuId));
                 console.log(`📉 [Kafka] Updated Product Stock: SKU ${item.skuId} changed from ${sku.stockQuantity} to ${newStock}`);
             }
          }
        }
      },
    });

    console.log('✅ Kafka Consumer connected and listening to topics');
  } catch (error) {
    console.error('❌ Kafka Consumer failed to connect (is Kafka running?):', (error as Error).message);
  }
};
