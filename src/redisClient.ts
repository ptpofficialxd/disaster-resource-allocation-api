import Redis from "ioredis";

const redisUri = `rediss://:Qqh8Gh7NRJVW7ArHbl79NWk7s3m4JftNoAzCaPG4ssE=@ptpofficialxd.redis.cache.windows.net:6380`;

const redisClient = new Redis(redisUri, {
  tls: {
    servername: 'ptpofficialxd.redis.cache.windows.net',
    rejectUnauthorized: false
  },
  enableAutoPipelining: true
});

export default redisClient;
