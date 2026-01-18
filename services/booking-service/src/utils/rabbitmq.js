const amqp = require("amqplib");

let channel = null;

/**
 * Connect to RabbitMQ and create channel
 */
const connectRabbitMQ = async () => {
  try {
    const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    
    console.log("🐰 Connecting to RabbitMQ...");
    const connection = await amqp.connect(RABBITMQ_URL);
    
    channel = await connection.createChannel();
    
    // Declare exchanges
    await channel.assertExchange("payment_events", "topic", { durable: true });
    await channel.assertExchange("booking_events", "topic", { durable: true });
    
    console.log("✅ RabbitMQ Connected");
    
    return channel;
  } catch (error) {
    console.error("❌ RabbitMQ Connection Error:", error);
    throw error;
  }
};

/**
 * Publish event to RabbitMQ
 */
const publishEvent = async (exchange, routingKey, message) => {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }
  
  try {
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    
    console.log(`📤 Published: ${exchange}.${routingKey}`, message);
  } catch (error) {
    console.error("❌ Error publishing event:", error);
    throw error;
  }
};

/**
 * Consume events from RabbitMQ
 */
const consumeEvent = async (exchange, routingKey, queueName, callback) => {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }
  
  try {
    // Assert queue
    await channel.assertQueue(queueName, { durable: true });
    
    // Bind queue to exchange
    await channel.bindQueue(queueName, exchange, routingKey);
    
    // Consume messages
    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log(`📥 Received: ${exchange}.${routingKey}`, data);
          
          // Process message
          await callback(data);
          
          // Acknowledge message
          channel.ack(msg);
        } catch (error) {
          console.error("❌ Error processing message:", error);
          // Requeue message on error
          channel.nack(msg, false, true);
        }
      }
    });
    
    console.log(`👂 Listening: ${exchange}.${routingKey} → ${queueName}`);
  } catch (error) {
    console.error("❌ Error setting up consumer:", error);
    throw error;
  }
};

module.exports = { connectRabbitMQ, publishEvent, consumeEvent };
