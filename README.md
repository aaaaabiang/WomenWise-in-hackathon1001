🏆 2nd Prize Winner – AI-Assisted Workflow Coding Hackathon.

👩‍💻 First-time hackathon participants building a collaborative AI workflow for reliable code generation.

⸻

🚀 Overview

This is a prototype of a multi-agent orchestration system for automating and validating AI-generated code. 
It integrates LLM-based generation, review, execution, and human feedback, offering a fault-tolerant, trustworthy pipeline for AI-assisted development.
⸻

💡 Core Value
	•	🤖 Reliable AI Coding: Enhances trust in AI-generated code through structured multi-agent review.
	•	🔁 Fault-Tolerant Design: Temporal manages retries, failures, and long-running workflows.
	•	🧍‍♀️ Human-in-the-Loop Feedback: Users can approve or reject code before execution.
	•	🔐 Sandbox Execution: Prevents unsafe operations or infinite loops.
	•	🧠 Educational Impact: Empowers developers to learn how AI-assisted workflows operate in real-world environments.

⸻

🧩 Project Structure

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


⸻

⚙️ Setup & Configuration

1️⃣ Create .env file under typescript/

OPENROUTER_API_KEY=sk-or-v1-xxxxxxx
OPENROUTER_MODEL_A=openai/gpt-4o-mini
OPENROUTER_MODEL_B=anthropic/claude-3.5-sonnet

⚠️ Do not commit .env to GitHub.
Each team member should create their own local file.

⸻

🧭 How to Run

Step 1. Start Temporal Server

temporal server start-dev

	•	Server: 127.0.0.1:7233
	•	Temporal UI: http://localhost:8233/

⸻

Step 2. Start the Worker

cd typescript
npm install
npm run worker

Expected output:

[Worker] listening on taskQueue=agents-queue


⸻

Step 3. Start the Client (Task Submission & Review)

1️⃣ Start a workflow

TASK="Write a function that determines if a number is prime" npm run start-wf

Output example:

[Client] started workflow: code-cocreate-1759309323080

2️⃣ Approve or reject (human review)

WF_ID=code-cocreate-1759309323080 npm run approve
# or
WF_ID=code-cocreate-1759309323080 npm run reject

3️⃣ View results

Visit Temporal UI → “Results” section
to see execution outputs and workflow logs.

⸻

Step 4. Run the Dashboard (Optional)

npm run dashboard

Then open http://localhost:4000/
to visualize the workflow results.

⸻

🧠 Future Vision
	•	📈 Extendable to all stages of LLM product pipelines (notebooks → scripts → APIs)
	•	📝 Applicable beyond programming — e.g., essay or policy document quality control
	•	🔁 Add more agents such as testing agents or prompt optimizers
	•	🔌 Deployable as IDE or GitHub Copilot plugin

⸻

⚠️ Known Limitations
	•	Multi-agent state management can be complex under time constraints.
	•	Sandbox security remains essential for executing AI-generated code safely.

⸻

🙏 Acknowledgements

Huge thanks to the Hackathon organizers, mentors, and Temporal community.
