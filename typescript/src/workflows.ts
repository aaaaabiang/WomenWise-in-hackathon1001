import { proxyActivities, defineSignal, defineQuery, setHandler, condition } from '@temporalio/workflow';
import type {
  AgentAGenerateInput, AgentAOutput,
  AgentBReviewInput, AgentBReview,
  AgentCExecInput, AgentCExecResult,
  HumanDecision, WorkflowInput,
  AttemptSummary, RoundSummary, WorkflowSnapshot
} from './types.js';

const { agentAGenerate, agentBReview, agentCExecute } = proxyActivities<{
  agentAGenerate(i: AgentAGenerateInput): Promise<AgentAOutput>;
  agentBReview(i: AgentBReviewInput): Promise<AgentBReview>;
  agentCExecute(i: AgentCExecInput): Promise<AgentCExecResult>;
}>({
  // 活动超时/重试策略（可按需调）
  startToCloseTimeout: '2 minute',
  retry: { maximumAttempts: 2 }
});

// Signal & Query
export const humanDecisionSignal = defineSignal<[HumanDecision, string?]>('humanDecision');
export const stateQuery = defineQuery<WorkflowSnapshot>('state');

export async function CodeCoCreateWorkflow(input: WorkflowInput): Promise<{ status: 'success' | 'failed'; message: string; output?: string; attempts: number }> {
  const maxRounds = input.maxRounds ?? 3;
  const maxAttempts = input.maxAttempts ?? 3;

  let attempts = 0;
  let lastFeedback: string | undefined = undefined;
  let currentState = 'INIT';
  const attemptsSummary: AttemptSummary[] = [];

  // 允许外部查询状态
  const snapshot = (): WorkflowSnapshot => ({
    workflowState: currentState,
    task: input.task,
    attempts: attemptsSummary,
    attemptsUsed: attempts,
    maxAttempts,
    maxRounds,
    waitingForHuman: currentState.includes('WAITING_HUMAN'),
    lastFeedback,
  });
  setHandler(stateQuery, () => snapshot());

  // 人审信号
  let pendingDecision: HumanDecision | null = null;
  let decisionComment: string | undefined = undefined;
  setHandler(humanDecisionSignal, (decision, comment) => {
    pendingDecision = decision;
    decisionComment = comment;
  });

  while (attempts < maxAttempts) {
    attempts++;
    currentState = `ATTEMPT_${attempts}_A_B_LOOP`;
    const attempt: AttemptSummary = {
      attempt: attempts,
      rounds: [],
      state: 'drafting',
      feedback: lastFeedback,
    };
    attemptsSummary.push(attempt);

    // ===== A/B 多轮协作 =====
    let approvedByB = false;
    let codeBlob = '';
    for (let round = 1; round <= maxRounds; round++) {
      currentState = `ATTEMPT_${attempts}_ROUND_${round}_A_GENERATE`;
      const aOut = await agentAGenerate({
        task: input.task,
        feedback: lastFeedback,
        attempt: attempts,
        round
      });

      codeBlob = aOut.code;
      const roundSummary: RoundSummary = {
        round,
        code: codeBlob,
        notes: aOut.notes,
      };
      attempt.rounds.push(roundSummary);

      currentState = `ATTEMPT_${attempts}_ROUND_${round}_B_REVIEW`;
      const review = await agentBReview({ task: input.task, code: codeBlob, round });
      roundSummary.review = review;

      if (review.approved) {
        approvedByB = true;
        lastFeedback = undefined; // 清掉
        attempt.state = 'awaiting-human';
        break;
      } else {
        lastFeedback = review.suggestions || review.reasons || 'Not approved';
        attempt.feedback = lastFeedback;
      }
    }

    if (!approvedByB) {
      currentState = `ATTEMPT_${attempts}_AB_FAILED`;
      attempt.state = 'failed';
      // 直接结束这次尝试（未通过 B），进入下一次 attempts
      continue;
    }

    // ===== 人类在环：等待人工批准 =====
    pendingDecision = null;
    decisionComment = undefined;
    currentState = `ATTEMPT_${attempts}_WAITING_HUMAN`;

    // 等信号（可加入超时逻辑，这里简单等到收到）
    await condition(() => pendingDecision !== null);

    if (pendingDecision === 'reject') {
      // 人工驳回：将评论作为反馈，进入下一次大尝试
      lastFeedback = decisionComment || 'Human rejected';
      currentState = `ATTEMPT_${attempts}_HUMAN_REJECTED`;
      attempt.humanReview = { decision: 'reject', comment: decisionComment };
      attempt.state = 'failed';
      attempt.feedback = lastFeedback;
      continue;
    }

    // ===== 执行代码 =====
    currentState = `ATTEMPT_${attempts}_EXECUTING`;
    attempt.state = 'executing';
    const exec = await agentCExecute({ code: codeBlob, task: input.task });
    attempt.execution = exec;

    if (exec.success) {
      currentState = `SUCCESS`;
      attempt.state = 'succeeded';
      attempt.humanReview = { decision: 'approve', comment: decisionComment };
      return { status: 'success', message: 'Execution succeeded', output: exec.output, attempts };
    } else {
      // 执行失败：把错误作为反馈，回到下一次大尝试
      lastFeedback = `Execution error: ${exec.error}`;
      currentState = `ATTEMPT_${attempts}_EXEC_FAILED`;
      attempt.state = 'failed';
      attempt.humanReview = { decision: 'approve', comment: decisionComment };
      attempt.feedback = lastFeedback;
      // 继续 while 循环
    }
  }

  currentState = 'FAILED_MAX_ATTEMPTS';
  return { status: 'failed', message: `Reached maxAttempts=${maxAttempts} without success.`, attempts };
}
