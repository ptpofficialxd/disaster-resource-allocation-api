import Redis from "ioredis";

const port = Number(Bun.env.REDIS_PORT);
const useTls = port === 6380;

const redisClient = new Redis({
  host: Bun.env.REDIS_HOST,
  port: port,
  password: Bun.env.REDIS_PASSWORD,
  tls: useTls ? { checkServerIdentity: () => undefined } : undefined,
});

export default redisClient;
