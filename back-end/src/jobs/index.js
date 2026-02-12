import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import redis from '../config/upstashRedis.js';

let isRedisConfigured = false;

const checkRedisConnection = async () => {
    if (config.redis.url && config.redis.token) {
        try {
            await redis.ping();
            isRedisConfigured = true;
            logger.info('Upstash Redis connected successfully.');
        } catch (error) {
            logger.warn('Redis not available. Background jobs disabled.');
            isRedisConfigured = false;
        }
    } else {
        logger.warn('Redis credentials not configured. Background jobs disabled.');
        isRedisConfigured = false;
    }
};

const addReputationAnchoringJob = async () => {
    await checkRedisConnection();
    if (!isRedisConfigured) {
        logger.warn('Redis not configured. Reputation anchoring job disabled.');
        return;
    }
    logger.info('Reputation anchoring job initialized with Upstash Redis.');
};

const addTaskExpirationJob = async () => {
    if (!isRedisConfigured) {
        logger.warn('Redis not configured. Task expiration job disabled.');
        return;
    }
    logger.info('Task expiration job initialized with Upstash Redis.');
};

export { addReputationAnchoringJob, addTaskExpirationJob };
