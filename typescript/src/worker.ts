import 'dotenv/config';
import { Worker } from '@temporalio/worker';
import * as activities from './activities.js';

async function run() {
  const taskQueue = process.env.TASK_QUEUE ?? 'agents-queue';

  const worker = await Worker.create({
    workflowsPath: new URL('./workflows.ts', import.meta.url).pathname, // ts-node/esm 会即时编译
    activities,
    taskQueue
  });

  console.log(`[Worker] listening on taskQueue=${taskQueue}`);
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
