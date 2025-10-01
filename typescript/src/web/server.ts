import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Connection, Client } from '@temporalio/client';
import type { HumanDecision, WorkflowSnapshot, WorkflowInput } from '../types.js';
import 'dotenv/config';

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../../public');
app.use(express.static(publicDir));

const port = Number(process.env.DASHBOARD_PORT ?? 4000);

const temporalClientPromise = (async () => {
  const connection = await Connection.connect();
  return new Client({ connection });
})();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/workflows/:id', async (req, res) => {
  try {
    const client = await temporalClientPromise;
    const handle = client.workflow.getHandle(req.params.id);
    const snapshot = await handle.query<WorkflowSnapshot>('state');
    res.json({ ok: true, data: snapshot });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: String(err?.message ?? err) });
  }
});

app.post('/api/workflows', async (req, res) => {
  const task = typeof req.body?.task === 'string' ? req.body.task.trim() : '';
  if (!task) {
    res.status(400).json({ ok: false, message: 'task is required' });
    return;
  }

  const baseInput: WorkflowInput = { task };
  const maybeRounds = Number(req.body?.maxRounds);
  const maybeAttempts = Number(req.body?.maxAttempts);
  if (!Number.isNaN(maybeRounds) && maybeRounds > 0) baseInput.maxRounds = Math.floor(maybeRounds);
  if (!Number.isNaN(maybeAttempts) && maybeAttempts > 0) baseInput.maxAttempts = Math.floor(maybeAttempts);

  const taskQueue = typeof req.body?.taskQueue === 'string' && req.body.taskQueue.trim()
    ? req.body.taskQueue.trim()
    : process.env.TASK_QUEUE ?? 'agents-queue';
  baseInput.taskQueue = taskQueue;

  try {
    const client = await temporalClientPromise;
    const workflowId = typeof req.body?.workflowId === 'string' && req.body.workflowId.trim()
      ? req.body.workflowId.trim()
      : `code-cocreate-${Date.now()}`;

    const handle = await client.workflow.start('CodeCoCreateWorkflow', {
      taskQueue,
      workflowId,
      args: [baseInput]
    });

    res.json({ ok: true, workflowId: handle.workflowId });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: String(err?.message ?? err) });
  }
});

app.post('/api/workflows/:id/decision', async (req, res) => {
  const decision = req.body?.decision as HumanDecision | undefined;
  const comment = req.body?.comment as string | undefined;
  if (decision !== 'approve' && decision !== 'reject') {
    res.status(400).json({ ok: false, message: 'decision must be approve|reject' });
    return;
  }

  try {
    const client = await temporalClientPromise;
    const handle = client.workflow.getHandle(req.params.id);
    await handle.signal('humanDecision', decision, comment);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: String(err?.message ?? err) });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Temporal dashboard listening on http://localhost:${port}`);
});
