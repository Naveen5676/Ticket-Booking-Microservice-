require("dotenv").config();

const amqp = require("amqplib");

let channel;

const rabbitMqUrl = process.env.RABBITMQ_URL;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(rabbitMqUrl);

    channel = await connection.createChannel();

    //Declare exchanges
    await channel.assertExchange("payment_events", "topic", { durable: true });
    await channel.assertExchange("booking_events", "topic", { durable: true });

    console.log("RabbitMQ connected");

    return channel;
  } catch (error) {
    throw error;
  }
};

/**
 * Publish event to RabbitMQ
 * @param {string} exchange - Exchange name
 * @param {string} routingKey - Routing key (e.g., "payment.success")
 * @param {object} message - Message object
 */
const publishEvent = async (exchange, routingKey, message) => {
  try {
    if (!channel) {
      throw new Error("Rabbmit MQ channel not initialized");
    }

    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
      },
    );

    console.log(`Event published: ${exchange}.${routingKey}`);
  } catch (error) {
    console.error("Error publish event", error);
    throw error;
  }
};

module.exports = {
  connectRabbitMQ,
  publishEvent,
};
