import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { wsaService } from '../services/wsaService.js';
import { computeService } from '../services/computeService.js';
import supabase from '../config/supabaseClient.js';

const connection = config.redis.host ? new IORedis({
    host: config.redis.host,
    port: config.redis.port || 6379,
    password: config.redis.password,
    maxRetriesPerRequest: null,
}) : null;

// Queue for polling WSA jobs
const wsaPollingQueue = connection ? new Queue('wsaPollingQueue', { connection }) : null;

// Queue for processing ComputeShare tasks
const computeShareQueue = connection ? new Queue('computeShareQueue', { connection }) : null;

/**
 * Adds a job to the WSA polling queue.
 * @param {string} jobId - The WSA job ID to poll.
 * @param {string} taskId - The internal task ID associated with the WSA job.
 */
const addWSAPollingJob = async (jobId, taskId) => {
    if (!wsaPollingQueue) {
        logger.warn('Redis not configured. WSA polling job disabled.');
        return;
    }
    await wsaPollingQueue.add('pollWSAJob', { jobId, taskId }, {
        repeat: { every: 30000 }, // Poll every 30 seconds
        jobId: `wsa-poll-${jobId}`, // Ensure unique job ID for repeat
    });
    logger.info(`Added WSA polling job for jobId: ${jobId}, taskId: ${taskId}`);
};

/**
 * Adds a job to the ComputeShare processing queue.
 * @param {object} task - The ComputeShare task to process.
 * @param {string} workerId - The ID of the worker (device) processing the task.
 */
const addComputeShareProcessingJob = async (task, workerId) => {
    if (!computeShareQueue) {
        logger.warn('Redis not configured. ComputeShare processing job disabled.');
        return;
    }
    await computeShareQueue.add('processComputeShareTask', { task, workerId });
    logger.info(`Added ComputeShare processing job for task: ${task.id}, worker: ${workerId}`);
};

// Worker for polling WSA jobs
const wsaPollingWorker = connection ? new Worker('wsaPollingQueue', async (job) => {
    const { jobId, taskId } = job.data;
    logger.debug(`Processing WSA polling job for jobId: ${jobId}, taskId: ${taskId}`);

    try {
        const status = await wsaService.pollWSAJobStatus(jobId);

        if (status.status === 'completed') {
            logger.info(`WSA job ${jobId} for task ${taskId} completed. Fetching results...`);
            // Assuming status.results contains the output
            const results = status.results;

            // Update the task in Supabase with the results
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'WSA_COMPLETED',
                    wsa_results: results,
                    completed_at: new Date(),
                })
                .eq('id', taskId);

            if (error) {
                logger.error(`Failed to update task ${taskId} with WSA results: ${error.message}`);
            } else {
                logger.info(`Task ${taskId} updated with WSA results.`);
            }

            // Remove the repeating job
            await wsaPollingQueue.removeRepeatableByKey(job.repeatJobKey);
        } else if (status.status === 'failed') {
            logger.error(`WSA job ${jobId} for task ${taskId} failed.`);
            // Handle failure: update task status, notify creator, etc.
            await supabase
                .from('tasks')
                .update({ status: 'WSA_FAILED', failed_at: new Date() })
                .eq('id', taskId);
            await wsaPollingQueue.removeRepeatableByKey(job.repeatJobKey);
        }
    } catch (error) {
        logger.error(`Error polling WSA job ${jobId} for task ${taskId}: ${error.message}`);
        // Re-throw to allow BullMQ to handle retries
        throw error;
    }
}, { connection }) : null;

// Worker for processing ComputeShare tasks
const computeShareWorker = connection ? new Worker('computeShareQueue', async (job) => {
    const { task, workerId } = job.data;
    logger.debug(`Processing ComputeShare task ${task.id} by worker ${workerId}`);

    try {
        await computeService.processComputeShareTask(task, workerId);
        // After processing, potentially update submission status or task status
        // This part depends on how ComputeShare tasks are integrated with submissions.
        // For now, assume processComputeShareTask handles DB updates.
    } catch (error) {
        logger.error(`Error processing ComputeShare task ${task.id} by worker ${workerId}: ${error.message}`);
        throw error;
    }
}, { connection }) : null;

if (wsaPollingWorker) {
    wsaPollingWorker.on('completed', job => {
        logger.debug(`WSA Polling Job ${job.id} completed.`);
    });

    wsaPollingWorker.on('failed', (job, err) => {
        logger.error(`WSA Polling Job ${job.id} failed with error: ${err.message}`);
    });
}

if (computeShareWorker) {
    computeShareWorker.on('completed', job => {
        logger.debug(`ComputeShare Job ${job.id} completed.`);
    });

    computeShareWorker.on('failed', (job, err) => {
        logger.error(`ComputeShare Job ${job.id} failed with error: ${err.message}`);
    });
}

export { addWSAPollingJob, addComputeShareProcessingJob };
