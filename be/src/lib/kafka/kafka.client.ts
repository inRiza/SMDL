import { Partitioners } from "kafkajs";
import { Kafka, logLevel } from "kafkajs";
import { env } from "@/lib/config/env.config";

let kafkaInstance: Kafka | null = null;

export function getKafka() {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: env.KAFKA_CLIENT_ID,
      brokers: env.KAFKA_BROKERS.split(",").map((b) => b.trim()),
      logLevel: logLevel.WARN,
      connectionTimeout: 10_000,
      requestTimeout: 30_000,
    });
  }
  return kafkaInstance;
}

export function getKafkaProducer() {
  return getKafka().producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });
}

export function getKafkaConsumer(groupId: string) {
  return getKafka().consumer({ groupId });
}
