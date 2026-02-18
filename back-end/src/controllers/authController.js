import { authService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import supabase from '../config/supabaseClient.js';

const loginOrRegister = asyncHandler(async (req, res) => {
    const { privyAccessToken, deviceFingerprint } = req.body;

    logger.info(`Login attempt with fingerprint: ${deviceFingerprint}`);

    if (!privyAccessToken) {
        throw new ApiError(400, 'Privy access token is required.');
    }
    if (!deviceFingerprint) {
        throw new ApiError(400, 'Device fingerprint is required.');
    }

    logger.info(`Verifying Privy token...`);
    // 1. Verify the token with Privy and get the full user object
    const privyUser = await authService.verifyPrivyToken(privyAccessToken);

    // 2. Find or create the user in our database
    let user = await authService.findUserByPrivyDid(privyUser.id);
    if (!user) {
        user = await authService.createNewUser(privyUser);
        logger.info(`New user created with Privy DID: ${user.privy_did}`);
    }

    // 3. Update device fingerprint and wallet address
    const embeddedWallet = privyUser.linked_accounts.find(
        (acc) => acc.type === 'wallet' && acc.wallet_type === 'embedded'
    );
    const externalWallet = privyUser.linked_accounts.find(
        (acc) => acc.type === 'wallet' && acc.wallet_type !== 'embedded'
    );

    const updatePayload = {
        last_fingerprint: deviceFingerprint,
        last_login_at: new Date(),
    };

    if (embeddedWallet) {
        updatePayload.embedded_wallet_address = embeddedWallet.address;
    }
    if (externalWallet) {
        updatePayload.wallet_address = externalWallet.address;
    }

    if (updatePayload.embedded_wallet_address || updatePayload.wallet_address) {
        const { error: updateError } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', user.id);

        if (updateError) {
            logger.error(`Failed to update login metadata: ${updateError.message}`);
        } else {
            logger.info(`Updated wallet addresses for user ${user.id}`);
        }
    }


    // 4. Generate a local JWT for our API
    const localToken = authService.generateLocalJWT(user);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        token: localToken,
        user: {
            id: user.id,
            privyDid: user.privy_did,
        },
    });
});

const getProfile = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

export const authController = {
    loginOrRegister,
    getProfile,
};
