import { Connection, Client } from '@temporalio/client';
import 'dotenv/config';

async function main() {
  const decision = (process.argv[2] as 'approve' | 'reject') ?? 'approve';
  const workflowId = process.env.WF_ID ?? process.env.WORKFLOW_ID; // 也可直接写死/从日志复制
  if (!workflowId) {
    console.error('请通过环境变量 WF_ID=<你的workflowId> 指定要操作的实例');
    process.exit(1);
  }

  const connection = await Connection.connect();
  const client = new Client({ connection });
  const handle = client.workflow.getHandle(workflowId);

  await handle.signal('humanDecision', decision, decision === 'reject' ? '需要增加边界输入检查' : 'LGTM ✅');

  console.log(`[Signal] Sent decision=${decision} to ${workflowId}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
