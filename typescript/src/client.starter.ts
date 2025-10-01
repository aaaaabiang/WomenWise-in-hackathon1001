import { Connection, Client } from '@temporalio/client';
import type { WorkflowInput } from './types.js';
import 'dotenv/config';

async function main() {
  const connection = await Connection.connect(); // 默认 127.0.0.1:7233
  const client = new Client({ connection });

  const input: WorkflowInput = {
    task: process.env.TASK ?? '写一个判断素数的函数',
    maxRounds: 3,
    maxAttempts: 3,
    taskQueue: process.env.TASK_QUEUE ?? 'agents-queue'
  };

  const handle = await client.workflow.start('CodeCoCreateWorkflow', {
    taskQueue: input.taskQueue!,
    workflowId: `code-cocreate-${Date.now()}`,
    args: [input]
  });

  
  console.log('[Client] started workflow:', handle.workflowId);
  console.log('Now run `npm run approve` 或 `npm run reject` 进行人审 Signal');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
