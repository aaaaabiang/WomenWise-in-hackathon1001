# 🧠 WomenWise: Multi-Agent AI Workflow with Human-in-the-Loop

🏆 **2nd Prize Winner – AI-Assisted Workflow Coding Hackathon**  
👩‍💻 *First-time hackathon participants building a collaborative AI workflow for reliable code generation.*



## 🚀 Overview

This is a prototype of a **multi-agent orchestration system** for automating and validating AI-generated code.  
It integrates **LLM-based generation, review, execution, and human feedback**, offering a **fault-tolerant, trustworthy pipeline** for AI-assisted development.



## 💡 Core Value

- 🤖 **Reliable AI Coding:** Enhances trust in AI-generated code through structured multi-agent review.  
- 🔁 **Fault-Tolerant Design:** Temporal manages retries, failures, and long-running workflows.  
- 🧍‍♀️ **Human-in-the-Loop Feedback:** Users can approve or reject code before execution.  
- 🔐 **Sandbox Execution:** Prevents unsafe operations or infinite loops.  
- 🧠 **Educational Impact:** Empowers developers to learn how AI-assisted workflows operate in real-world environments.



## 🧩 Project Structure
```
/typescript
├── src/
│   ├── workflows.ts         # 🧠 Main Temporal Workflow Orchestration
│   │                        # • Loop between Agent A (generate) and Agent B (review).
│   │                        # • Conditional wait for human approval signal.
│   │                        # • Sends final result to Agent C for execution.
│   ├── activities.ts        # 🤖 Activity Definitions: Agent A, B, C
│   │                        # • Agent A: Generates JS code using LLM.
│   │                        # • Agent B: Reviews code, decisions and suggestions.
│   │                        # • Agent C: Safely executes JS using Function sandbox.
│   ├── worker.ts            # 🛠️ Temporal Worker Setup
│   ├── client.starter.ts    # 🚀 Workflow Initiator
│   │                        # • Task description (e.g. “Write a function to check for primes”)
│   │                        # • Configurable maxRounds, maxAttempts.
│   ├── client.signal.ts     # 🧍 Send Human Feedback
│   │                        # • Sends approval or rejection to a running workflow instance.
│   ├── types.ts             # 📦 Shared Types and Interfaces
│   └── web/
│       └── server.ts        # 🌐 Express.js Server for Demo UI
├── tsconfig.json            # ⚙️ TypeScript Configuration
└── package.json             # 📦 Dependency and Script Definitions
```


 
## ⚙️ Setup & Configuration

### Step 1. Start Temporal Server
```bash
temporal server start-dev
```

### Step 2. Start the Worker 
```bash 
cd typescript
npm install
npm run worker
```

### Step 3. Start the Client (Task Submission & Review)
1️⃣ Start a workflow
```bash 
TASK="Write a function that determines if a number is prime"
npm run start-wf
```
2️⃣ Approve or reject (human review)
```bash 
WF_ID=code-cocreate-1759309323080 npm run approve
# or
WF_ID=code-cocreate-1759309323080 npm run reject
```
3️⃣ View results  
Visit Temporal UI → “Results” section to see execution outputs and workflow logs.


## 📊 Run the Frontend Dashboard 
```bash
npm run dashboard
```

## 🧠 Future Vision
- 📈 Extendable to all stages of LLM product pipelines (notebooks → scripts → APIs)
-	📝 Applicable beyond programming — e.g., essay or policy document quality control
-	🔁 Add more agents such as testing agents or prompt optimizers
- 🔌 Deployable as IDE or GitHub Copilot plugin



## ⚠️ Known Limitations
- Multi-agent state management can be complex under time constraints.
- Sandbox security remains essential for executing AI-generated code safely.



## 🙏 Acknowledgements

Huge thanks to the Hackathon organizers, mentors, and the Temporal community.
