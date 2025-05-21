import Redis from "ioredis";
import app from "./api";

// Connect to Redis
const redis = new Redis({
  host: Bun.env.REDIS_HOST,
  port: Number(Bun.env.REDIS_PORT),
  password: Bun.env.REDIS_PASSWORD,
  tls: Bun.env.REDIS_PORT === "6380" ? { checkServerIdentity: () => undefined } : undefined
});

// Successfully connected to Redis
redis.on("connect", () => {
  console.log("Connected to Azure Redis");
});

// Handle Redis connection errors
redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

// Start localhost server
Bun.serve({
  hostname: "0.0.0.0",
  port: Number(Bun.env.PORT),
  fetch: app.fetch
});

console.log(`Server is running on http://localhost:${Bun.env.PORT}`);

export default redis;
