import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Connection, Client } from '@temporalio/client';
import type { HumanDecision, WorkflowSnapshot } from '../types.js';
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
