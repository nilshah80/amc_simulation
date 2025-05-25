const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = new Redis(config.redis);
    
    this.client.on('connect', () => {
      logger.info('Redis connected');
    });

    this.client.on('error', (err) => {
      logger.error('Redis error', err);
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      throw error;
    }
  }

  async set(key, value, ttl = null) {
    try {
      if (ttl) {
        return await this.client.setex(key, ttl, value);
      }
      return await this.client.set(key, value);
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
      throw error;
    }
  }

  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      throw error;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      throw error;
    }
  }

  async hset(key, field, value) {
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      logger.error('Redis HSET error', { key, field, error: error.message });
      throw error;
    }
  }

  async hget(key, field) {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      logger.error('Redis HGET error', { key, field, error: error.message });
      throw error;
    }
  }

  async hgetall(key) {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      logger.error('Redis HGETALL error', { key, error: error.message });
      throw error;
    }
  }

  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis INCR error', { key, error: error.message });
      throw error;
    }
  }

  async lpush(key, ...values) {
    try {
      return await this.client.lpush(key, ...values);
    } catch (error) {
      logger.error('Redis LPUSH error', { key, error: error.message });
      throw error;
    }
  }

  async rpop(key) {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      logger.error('Redis RPOP error', { key, error: error.message });
      throw error;
    }
  }

  async healthCheck() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed', error);
      return false;
    }
  }

  async close() {
    await this.client.quit();
  }

  async ping() {
    try {
      return await this.client.ping();
    } catch (error) {
      logger.error('Redis PING error', { error: error.message });
      throw error;
    }
  }
}

module.exports = new RedisClient();
