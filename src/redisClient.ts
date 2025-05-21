import Redis from "ioredis";

const redisClient = new Redis({
  host: Bun.env.REDIS_HOST,
  port: Number(Bun.env.REDIS_PORT),
  password: Bun.env.REDIS_PASSWORD,
  tls: {
    servername: Bun.env.REDIS_HOST,
    rejectUnauthorized: false,
  },
});

export default redisClient;