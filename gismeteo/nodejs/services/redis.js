const redis = require('redis'),
      configs=require('../configs/configs.js'),
      redisConfig = configs.redis;
const client = redis.createClient(redisConfig.port,redisConfig.host);

client.connect().then(()=> {
    console.log('Redis connected');
});

client.on('error', (err) => {
  console.log('Redis error', err)
});

module.exports.client =client;
