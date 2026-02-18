import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

export const debugPrivyToken = (token) => {
    try {
        // Decode without verification to see the payload
        const decoded = jwt.decode(token, { complete: true });
        
        logger.info('=== PRIVY TOKEN DEBUG ===');
        logger.info(`Header: ${JSON.stringify(decoded.header)}`);
        logger.info(`Payload: ${JSON.stringify(decoded.payload)}`);
        logger.info(`Issued At: ${new Date(decoded.payload.iat * 1000).toISOString()}`);
        logger.info(`Expires At: ${new Date(decoded.payload.exp * 1000).toISOString()}`);
        logger.info(`Current Time: ${new Date().toISOString()}`);
        logger.info(`Token Expired: ${decoded.payload.exp * 1000 < Date.now()}`);
        logger.info(`App ID (aud): ${decoded.payload.aud}`);
        logger.info(`User DID (sub): ${decoded.payload.sub}`);
        logger.info('========================');
        
        return decoded;
    } catch (error) {
        logger.error(`Failed to decode token: ${error.message}`);
        return null;
    }
};
