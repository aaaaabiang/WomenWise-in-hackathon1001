// src/activities.ts
import type {
  AgentAGenerateInput, AgentAOutput,
  AgentBReviewInput, AgentBReview,
  AgentCExecInput, AgentCExecResult
} from './types.js';

/** ============ OpenRouter 基础封装 ============ */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_A = process.env.OPENROUTER_MODEL_A || 'openai/gpt-4o-mini';
const MODEL_B = process.env.OPENROUTER_MODEL_B || 'openai/gpt-4o-mini';

async function callOpenRouterChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string,
  opts?: { temperature?: number }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // 以下两个是建议提供的统计/标识头，不提供也能用
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost',
      'X-Title': process.env.APP_TITLE || 'Temporal Agents',
    },
    body: JSON.stringify({
      model,
      temperature: opts?.temperature ?? 0.2,
      messages
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter HTTP ${res.status}: ${text}`);
  }
  const data: any = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

/** ============ Agent A：生成代码（接 LLM） ============ */
// 替换原有 agentAGenerate
export async function agentAGenerate(input: AgentAGenerateInput): Promise<AgentAOutput> {
  const system = `You are a senior engineer. Return ONLY a runnable JavaScript code block.
Specs:
- CommonJS module.
- Export a function \`solve(input)\`.
- Also export \`sampleTests\`: Array<{ input: any, expected: any }> with 6-10 diverse cases.
- No external deps. Pure JS. Keep code self-contained.`;

  const user = [
    `Task: ${input.task}`,
    input.feedback ? `Incorporate feedback: ${input.feedback}` : '',
    `Return format (exactly):`,
    '```js',
    '// your code ...',
    'module.exports = { solve, sampleTests };',
    '```'
  ].filter(Boolean).join('\n');

  const content = await callOpenRouterChat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    MODEL_A,
    { temperature: 0.2 }
  );

  const m = content.match(/```(?:js|javascript)?\s*([\s\S]*?)```/i);
  const code = (m ? m[1] : content).trim();
  return { code, notes: input.feedback ? 'Applied feedback.' : undefined };
}


/** ============ Agent B：代码审查（接 LLM，要求 JSON） ============ */
export async function agentBReview(input: AgentBReviewInput): Promise<AgentBReview> {
  const system = `You are a code reviewer. Output STRICT JSON only. Schema: {"approved": boolean, "suggestions": string, "reasons": string}`;
  const user =
`Review the following code for the task: "${input.task}"
Round: ${input.round}
CODE:
${'```js'}
${input.code}
${'```'}

Evaluate correctness (edge cases), clarity, and safety. 
If the code is suitable for execution as-is, set "approved": true and briefly justify in "reasons".
If not, set "approved": false and put concrete fix steps in "suggestions". 
Return ONLY the JSON object, no extra text.`;

  const raw = await callOpenRouterChat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    MODEL_B,
    { temperature: 0.1 }
  );

  // 只取 JSON
  const jsonText = (() => {
    const m = raw.match(/\{[\s\S]*\}$/); // 抓最后一个 JSON 对象
    return m ? m[0] : raw;
  })();

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // 兜底策略：无法解析就不给通过，要求按 schema 重来
    return { approved: false, suggestions: 'Please return strict JSON per schema and list concrete code changes.' };
  }

  const approved = !!parsed.approved;
  const suggestions = typeof parsed.suggestions === 'string' ? parsed.suggestions : undefined;
  const reasons = typeof parsed.reasons === 'string' ? parsed.reasons : undefined;

  return approved ? { approved, reasons } : { approved, suggestions };
}

/** ============ Agent C：执行代码（已修复 CommonJS 注入） ============ */
// 替换原有 agentCExecute
export async function agentCExecute(input: AgentCExecInput): Promise<AgentCExecResult> {
  try {
    // Demo 执行：生产建议用 VM/Docker 沙箱
    const module = { exports: {} as any };
    const exports = module.exports;
    const fn = new Function('module', 'exports', `${input.code}; return module.exports;`);
    const mod = fn(module, exports);

    if (typeof mod.solve !== 'function') {
      return { success: false, error: 'Missing export: solve(input)' };
    }
    if (!Array.isArray(mod.sampleTests) || mod.sampleTests.length === 0) {
      return { success: false, error: 'Missing export: sampleTests (non-empty array)' };
    }

    const lines: string[] = [];
    let fails = 0;
    for (let i = 0; i < mod.sampleTests.length; i++) {
      const { input: tin, expected } = mod.sampleTests[i];
      const got = await mod.solve(tin);
      const ok = JSON.stringify(got) === JSON.stringify(expected);
      if (!ok) fails++;
      lines.push(`#${i} ok=${ok}  input=${JSON.stringify(tin)}  got=${JSON.stringify(got)}  expected=${JSON.stringify(expected)}`);
    }

    if (fails > 0) return { success: false, error: `Failed ${fails}/${mod.sampleTests.length}\n` + lines.join('\n') };
    return { success: true, output: lines.join('\n') };
  } catch (e: any) {
    return { success: false, error: String(e?.stack || e) };
  }
}
