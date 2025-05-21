import Redis from "ioredis";

const port = Number(process.env.REDIS_PORT);
const useTls = port === 6380;

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: port,
  password: process.env.REDIS_PASSWORD,
  tls: useTls ? { checkServerIdentity: () => undefined } : undefined,
});

export default redisClient;
