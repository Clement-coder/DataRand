import { PrivyClient } from '@privy-io/server-auth';
import config from './index.js';

const privyAppId = config.privy.appId;
const privyAppSecret = config.privy.appSecret;

if (!privyAppId || !privyAppSecret) {
    throw new Error('Privy App ID or Secret is not defined in the environment variables.');
}

console.log(`Initializing Privy client with App ID: ${privyAppId}`);
if (typeof privyAppSecret !== 'string' || privyAppSecret.length < 10) {
    throw new Error(`Invalid Privy App Secret. The secret is either not a string or is too short. Value: '${privyAppSecret}'`);
}
console.log('Privy App Secret appears to be valid.');

const privyClient = new PrivyClient(privyAppId, privyAppSecret);

export default privyClient;