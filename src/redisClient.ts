import Redis from "ioredis";

const redisClient = new Redis({
  host: Bun.env.REDIS_HOST,
  port: Number(Bun.env.REDIS_PORT),
  password: Bun.env.REDIS_PASSWORD,
  tls: Bun.env.REDIS_PORT === "6380" ? { checkServerIdentity: () => undefined } : undefined
});

export default redisClient;