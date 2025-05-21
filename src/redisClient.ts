import Redis from "ioredis";

const redisClient = new Redis({
  host: Bun.env.REDIS_HOST,
  port: Number(Bun.env.REDIS_PORT),
});

export default redisClient;