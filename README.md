# Review.AI — AI-Powered Code Review Assistant

A production-oriented Full-Stack AI Code Review Assistant built matching the Internship Assessment guidelines. The system parses uploaded directories/ZIP files, represents codebases in a live interactive File Explorer, executes AI audits for **Security**, **Performance**, and **Code Quality**, and provides an AI Copilot chat workspace.

---

## 🚀 Repository & Stack Structure

This workspace is divided into two decoupled modules:
- **Frontend** ([frontend/](file:///f:/projects/assignment/frontend)): Next.js (TypeScript) styled with a premium Glassmorphic Salt & Pepper CSS design.
- **Backend** ([backend/](file:///f:/projects/assignment/backend)): NestJS API controller server managing auth, project storage, file unzipping, LLM connection testing, reviews, and test/docs generators.
- **Database**: MongoDB (running locally on default port `27017`) mapped via Prisma ORM.

---

## 🛠️ Installation & Setup

### Prerequisites
1. **Node.js**: Version v18 or later.
2. **MongoDB**: Ensure a local MongoDB server instance is listening on port `27017`.

### 1. Database & Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```env
   DATABASE_URL="mongodb://localhost:27017/review_ai"
   JWT_SECRET="super-secret-key-review-ai-dashboard-token"
   PORT=4000
   ```
4. Sync Prisma schema definitions with MongoDB indexes:
   ```bash
   npx prisma db push
   ```
5. Launch the NestJS API server in development mode:
   ```bash
   npm run start:dev
   ```
   *The backend server will run at http://localhost:4000*

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be active at http://localhost:3000*

---

## 💡 Key Assessment Features

- **Automated Registration**: Automatically seeds standard provider profiles (**OpenAI**, **Ollama**, and **LM Studio**) for every registered user.
- **ZIP File & Drag & Drop Handling**: Decompresses nested structure maps on the fly via `unzipper` streams.
- **AI Review Engine & Static Fallback**: Prompts LLMs for structured JSON issues. If connection timeouts or API errors occur, a static regex code pattern scanner triggers automatically to guarantee instant feedback.
- **AI Copilot Chat**: Connects conversation history and project code files context.
- **Bonus Generators**:
  - **Unit Test Generator**: Generates mock-assert test files matching the file language.
  - **Project Documenter**: Generates professional project overview markdown README guides.

---

## 🧪 Port Allocation

| Module | URL | Details |
| :--- | :--- | :--- |
| **Frontend** | `http://localhost:3000` | Next.js Client Workspace |
| **Backend API** | `http://localhost:4000/api` | NestJS Controller Engine |
| **Database** | `mongodb://localhost:27017/review_ai` | MongoDB Server Session |
