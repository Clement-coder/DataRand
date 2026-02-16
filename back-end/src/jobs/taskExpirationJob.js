import { logger } from '../utils/logger.js';

/**
 * Task expiration has been disabled.
 * Tasks no longer expire based on time.
 * Payouts are released only after manual approval.
 */
const addTaskExpirationJob = async () => {
    logger.info('Task expiration disabled - tasks do not expire based on time.');
};

export { addTaskExpirationJob };
