# AI Usage & Development Log — Review.AI

This file documents the utilization of AI tools, prompting instructions, and development contributions in building this project.

---

## 🤖 AI Development Agent: Antigravity

- **Agent Name**: Antigravity (Advanced Agentic AI Coding Assistant designed by Google DeepMind)
- **Environment**: VS Code / Gemini Coding Sandbox (Windows, PowerShell)
- **Role**: Pair programmer leading file migration, database configuration, full-stack API controllers, frontend UI layouts integration, and offline verification checks.

---

## 💬 Prompts & Interaction History

During the development, the following prompting structures were leveraged:

1. **Prisma Schema Generation**:
   * *Prompt*: "Design a relational Prisma database schema matching a full stack code review assistant that tracks Users, Projects, Files, Reviews, Issues, AIProviders, and Chat sessions. Ensure support for cascading deletions."
   * *Action*: Drafted schema and migrated it to MongoDB using `@db.ObjectId` configurations.
   
2. **NestJS API Controller Design**:
   * *Prompt*: "Create a NestJS backend with modules for JWT Auth, Project management, ZIP extraction, AI reviews with a static backup parser, and Copilot chats. Add unit test and README summary generators."
   * *Action*: Developed auth strategies, file stream unzippers, and fallback regex patterns.
   
3. **Frontend Integration**:
   * *Prompt*: "Rewrite AppContext to make real fetch calls to the NestJS port, handling Bearer JWT tokens, projects mapping, file upload zone, connection checks, and Sparkles generator overlays."
   * *Action*: Linked authentication, uploads, copilot chats, and generated test/docs views.

---

## 🛠️ AI Tool Integrations inside the Assistant

The application supports three primary AI models via compatible API protocols:

1. **OpenAI API**:
   * *Endpoint*: `https://api.openai.com/v1`
   * *Required model*: `gpt-4o-mini` (or standard `gpt-4`)
   * *Auth*: Bearer API token keys.
   
2. **Ollama (Local)**:
   * *Endpoint*: `http://localhost:11434/v1`
   * *Required model*: `codegemma:latest` (or any loaded LLM model like `llama3` / `deepseek-coder`)
   * *Auth*: Empty.
   
3. **LM Studio (Local)**:
   * *Endpoint*: `http://localhost:1234/v1`
   * *Required model*: `qwen2.5-coder-7b` (or active local model)
   * *Auth*: Empty.
