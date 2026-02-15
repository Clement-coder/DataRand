import { logger } from '../utils/logger.js';
import supabase from '../config/supabaseClient.js';

const ASSIGNMENT_TTL_MINUTES = 5; // Assignments expire after 5 minutes if not submitted
let expirationInterval = null;

/**
 * Check and expire pending task assignments
 */
const checkExpiredAssignments = async () => {
    const expirationThreshold = new Date(Date.now() - ASSIGNMENT_TTL_MINUTES * 60 * 1000).toISOString();

    try {
        const { data: expiredAssignments, error } = await supabase
            .from('task_assignments')
            .select('id, task_id, worker_id')
            .in('status', ['accepted', 'in_progress'])
            .lt('started_at', expirationThreshold);

        if (error) {
            logger.error(`Error fetching expired assignments: ${error.message}`);
            return;
        }

        if (expiredAssignments && expiredAssignments.length > 0) {
            logger.warn(`Found ${expiredAssignments.length} expired task assignments.`);

            const expiredAssignmentIds = expiredAssignments.map(a => a.id);

            // Mark assignments as abandoned
            const { error: updateError } = await supabase
                .from('task_assignments')
                .update({ status: 'abandoned', completed_at: new Date().toISOString() })
                .in('id', expiredAssignmentIds);

            if (updateError) {
                logger.error(`Error updating expired assignments: ${updateError.message}`);
                return;
            }

            expiredAssignments.forEach(a => {
                logger.info(`Assignment ${a.id} for task ${a.task_id} by worker ${a.worker_id} expired and marked as abandoned.`);
            });
        }
    } catch (error) {
        logger.error(`Task expiration check failed: ${error.message}`);
    }
};

/**
 * Initialize task expiration job
 */
const addTaskExpirationJob = async () => {
    if (expirationInterval) {
        clearInterval(expirationInterval);
    }
    
    // Run immediately
    await checkExpiredAssignments();
    
    // Run every minute
    expirationInterval = setInterval(checkExpiredAssignments, 60000);
    logger.info('Task expiration job started (runs every 60 seconds).');
};

export { addTaskExpirationJob };
