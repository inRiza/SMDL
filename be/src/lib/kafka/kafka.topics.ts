import { env } from "@/lib/config/env.config";
import { getKafka } from "./kafka.client";

export async function ensureKafkaTopic() {
  const admin = getKafka().admin();

  await admin.connect();
  try {
    const topics = await admin.listTopics();
    if (topics.includes(env.KAFKA_TOPIC)) return;

    await admin.createTopics({
      waitForLeaders: true,
      topics: [
        {
          topic: env.KAFKA_TOPIC,
          numPartitions: 3,
          replicationFactor: 1,
        },
      ],
    });

    console.log(`[kafka] topic "${env.KAFKA_TOPIC}" created (3 partitions)`);
  } finally {
    await admin.disconnect();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForKafkaReady(maxAttempts = 12, delayMs = 2_500) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await ensureKafkaTopic();
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[kafka] not ready (${attempt}/${maxAttempts}): ${message}`);
      if (attempt === maxAttempts) throw error;
      await sleep(delayMs);
    }
  }
}
