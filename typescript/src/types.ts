export interface AgentAGenerateInput {
  task: string;
  feedback?: string; // 来自上轮审查/执行失败的建议
  attempt: number;   // 第几次大尝试（执行失败会回到 A）
  round: number;     // A/B 协作第几轮
}

export interface AgentAOutput {
  code: string;
  notes?: string;
}

export interface AgentBReviewInput {
  task: string;
  code: string;
  round: number;
}

export interface AgentBReview {
  approved: boolean;
  suggestions?: string; // 未通过时的修改建议
  reasons?: string;
}

export interface AgentCExecInput {
  code: string;
  task: string;
}

export interface AgentCExecResult {
  success: boolean;
  output?: string;
  error?: string;
}

export type HumanDecision = 'approve' | 'reject';

export interface WorkflowInput {
  task: string;          // 用户任务描述（例：写判断素数函数）
  maxRounds?: number;    // A/B 交互最大轮数，默认 3
  maxAttempts?: number;  // 全流程最大尝试次数（含执行失败后回退），默认 3
  taskQueue?: string;    // Worker 的任务队列名
}
