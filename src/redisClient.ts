import Redis from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: {
    servername: process.env.REDIS_HOST,
    rejectUnauthorized: false,
  },
};

console.log('Redis Connection Config:', {
  host: redisConfig.host,
  port: redisConfig.port,
  hasPassword: !!redisConfig.password,
  tlsEnabled: true
});

const redisClient = new Redis(redisConfig);

export default redisClient;
