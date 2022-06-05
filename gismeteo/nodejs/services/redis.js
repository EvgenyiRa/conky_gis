const redis = require('redis'),
      configs=require('../configs/configs.js'),
      redisConfig = configs.redis;
const client = redis.createClient(redisConfig.port,redisConfig.host);

module.exports.client =client;
