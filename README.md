# 🧠 WomenWise: Multi-Agent AI Workflow with Human-in-the-Loop

🏆 **2nd Prize Winner – AI-Assisted Workflow Coding Hackathon**  
👩‍💻 *First-time hackathon participants building a collaborative AI workflow for reliable code generation.*

---

## 🚀 Overview

This is a prototype of a **multi-agent orchestration system** for automating and validating AI-generated code.  
It integrates **LLM-based generation, review, execution, and human feedback**, offering a **fault-tolerant, trustworthy pipeline** for AI-assisted development.

---

## 💡 Core Value

- 🤖 **Reliable AI Coding:** Enhances trust in AI-generated code through structured multi-agent review.  
- 🔁 **Fault-Tolerant Design:** Temporal manages retries, failures, and long-running workflows.  
- 🧍‍♀️ **Human-in-the-Loop Feedback:** Users can approve or reject code before execution.  
- 🔐 **Sandbox Execution:** Prevents unsafe operations or infinite loops.  
- 🧠 **Educational Impact:** Empowers developers to learn how AI-assisted workflows operate in real-world environments.

---

## 🧩 Project Structure
typescript/
├── src/
│   ├── workflows.ts        # Temporal workflow logic (Agent A↔B↔Human↔C)
│   ├── activities.ts       # AI agent activities for generation, review, execution
│   ├── worker.ts           # Registers and runs Temporal worker
│   ├── client.starter.ts   # Starts workflow with user task
│   ├── client.signal.ts    # Sends human approval/rejection
│   ├── types.ts            # Shared type definitions
│   └── web/dashboard.ts    # Simple dashboard to visualize results
├── .env                    # Local environment variables (excluded from Git)
├── package.json
└── tsconfig.json
