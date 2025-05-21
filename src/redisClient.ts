import Redis from "ioredis";

const redisUri = `rediss://:${encodeURIComponent(process.env.REDIS_PASSWORD || '')}@${process.env.REDIS_HOST}:6380`;

const redisClient = new Redis(redisUri, {
  tls: {
    servername: 'ptpofficialxd.redis.cache.windows.net',
    rejectUnauthorized: false
  },
  enableAutoPipelining: true
});

export default redisClient;
