# FSB Demo Architecture Analysis: Prompt → Context → Prototype Flow

**Date:** December 14, 2025  
**Purpose:** Understand FSB demo requirements and current architecture gaps

---

## What is FSB?

**FSB = Full Stack Builder**

- Target user: Tech leads/PMs who are "full stack builders" (engineers who also do PM/design work)
- Use case: Help FSBs make product decisions and rapidly prototype solutions
- Value prop: "Facilitator plus Institutional Memory" - combines decision-making with company knowledge

**Key LinkedIn Demo Metrics:**
- Pull request throughput (primary North Star)
- Innovation velocity (experiments to production)

---

## The Prompt → Context → Prototype Flow

### Ideal Flow (from PRD)

```
User Prompt
  ↓
[1] Context Search (Hybrid: BM25 + Vector)
  ↓
[2] Advise (Structured Options A/B/C with rationale)
  ↓
[3] User Chooses Option
  ↓
[4] ChangeSpec Generation (Structured spec from option)
  ↓
[5] Prototype Generation (v0 creates 2-3 UI variants)
  ↓
[6] Draft PR Creation (GitHub PR with preview)
```

### Detailed Steps

#### Step 1: Prompt → Context (`POST /api/advise`)
**Input:** User question (e.g., "We're redoing onboarding. What fits our goals?")

**Process:**
1. Hybrid search (BM25 + vector embeddings)
   - Search OKRs, PRDs, decisions, transcripts
   - Filter by tags (e.g., "onboarding", "activation")
   - Return top ~5 docs with snippets

**Output:** `AdviseResponse`
```ts
{
  contextUsed: [
    { id, title, type, reason } // Why each doc is relevant
  ],
  options: [
    {
      id: "A" | "B" | "C",
      label: string,
      description: string,
      rationale: string, // Tied to context
      risks: string[],
      recommended: boolean
    }
  ]
}
```

#### Step 2: Choose Option → ChangeSpec (`POST /api/change-spec`)
**Input:** Question + chosen option + context used

**Output:** `ChangeSpec`
```ts
{
  title: string,
  summary: string,
  user_story: string,
  acceptance_criteria: string[],
  surfaces: ("web" | "mobile")[],
  target_route?: string,
  target_components?: string[],
  constraints?: string[],
  metrics_focus?: string[],
  priority?: "now" | "next" | "later"
}
```

#### Step 3: ChangeSpec → Prototypes (`POST /api/generate-prototypes`)
**Input:** ChangeSpec

**Process:**
- Compose prompt for v0 Platform API
- Include repo context (Next.js, Tailwind, shadcn)
- Ask for 2-3 UI variants

**Output:**
```ts
{
  variants: [
    {
      id: string,
      name: string,
      files: { path: string, content: string }[],
      demoUrl?: string
    }
  ]
}
```

#### Step 4: Prototype → Draft PR (`POST /api/create-draft-pr`)
**Input:** Variant files + ChangeSpec + context used

**Process:**
- Create GitHub branch
- Write files to repo
- Create draft PR with:
  - Title: ChangeSpec.title
  - Body: Summary + context used + note about Roy/v0 generation

**Output:**
```ts
{
  prUrl: string,
  branchName: string
}
```

**Vercel auto-creates Preview Deployment** for the PR.

---

## Current Architecture Analysis

### ✅ What We Have

#### 1. Context Search (`workflows/chat.ts`)
```ts
async function contextStep(query: string) {
  const searchResults = searchContent(query, 5);
  const tasks = getContentByType("task");
  const okrs = getContentByType("okr");
  
  return {
    search: searchResults.map(...),
    tasks: tasks.map(...),
    okrs: okrs.map(...)
  };
}
```

**Status:** ✅ Basic keyword search implemented
**Gap:** ❌ No hybrid search (BM25 + vector), no structured reasoning

#### 2. Design Workflow (`workflows/design.ts`)
```ts
export async function designWorkflow(input: {
  task: string;
  requirements?: string;
}) {
  const project = await createProject();
  const chat = await createChat(project.id, prompt);
  const deployment = await createDeployment(...);
  
  return {
    type: "design",
    previewUrl: deployment.webUrl,
    chatId: chat.id,
    projectId: project.id,
    files: chat.latestVersion.files
  };
}
```

**Status:** ✅ Creates v0 project, chat, deployment
**Gap:** ❌ No ChangeSpec input, no structured variant generation

#### 3. Engineering Workflow (`workflows/engineering.ts`)
```ts
export async function engineeringWorkflow(input: {
  task: string;
  targetFiles?: string[];
}) {
  const codeGen = await generateText(...);
  // Creates branch, commits, PR
  return {
    type: "engineering",
    prUrl: pr.html_url,
    prNumber: pr.number,
    branch: branchName,
    files: files.map(f => f.path)
  };
}
```

**Status:** ✅ Creates GitHub PR with generated code
**Gap:** ❌ No ChangeSpec context, no preview URL fetching

#### 4. Chat Agent (`workflows/chat.ts`)
```ts
const tools = {
  context: { /* searches content */ },
  workflow: { /* triggers design/engineering */ },
  status: { /* checks workflow status */ }
};
```

**Status:** ✅ Conversational interface with tools
**Gap:** ❌ No structured advise step, no ChangeSpec generation

---

## ❌ What's Missing

### 1. Structured Advise Step
**Missing:** `/api/advise` endpoint that returns structured options

**Current:** Context search returns raw results
**Needed:** LLM call that synthesizes context into structured options (A/B/C) with rationale

**Implementation Needed:**
- Add `adviseStep` function that:
  1. Takes user question
  2. Calls `contextStep` for search results
  3. LLM call with system prompt: "You are Roy, a staff PM/tech lead..."
  4. Returns `AdviseResponse` with options tied to context

### 2. ChangeSpec Generation
**Missing:** `/api/change-spec` endpoint

**Current:** Direct task → workflow
**Needed:** Option selection → ChangeSpec → workflow

**Implementation Needed:**
- Add `changeSpecStep` function that:
  1. Takes question + chosen option + context used
  2. LLM call to generate structured `ChangeSpec`
  3. Returns ChangeSpec JSON

### 3. Hybrid Search
**Missing:** BM25 + vector embeddings

**Current:** Simple keyword search (`searchContent`)
**Needed:** Hybrid search with pgvector

**Implementation Needed:**
- Postgres table with `text_vector` column
- Embedding generation for documents
- SQL query combining BM25 + cosine distance
- Tag-based filtering

### 4. Structured Prototype Generation
**Missing:** ChangeSpec → structured variants

**Current:** Task string → v0 chat → deployment
**Needed:** ChangeSpec → v0 prompt → 2-3 variants with structured output

**Implementation Needed:**
- Modify `designWorkflow` to accept ChangeSpec
- Compose structured v0 prompt with:
  - Repo context
  - ChangeSpec JSON
  - Request for 2-3 variants
- Parse structured response (variants with names, files, demo URLs)

### 5. Preview URL Integration
**Missing:** Fetch Vercel preview URL from PR

**Current:** PR created, but no preview URL surfaced
**Needed:** Extract preview URL from PR checks/deployments

**Implementation Needed:**
- GitHub API to check PR status checks
- Vercel API to get deployment URL
- Or parse PR body for preview link

### 6. Frontend UX Flow
**Missing:** Structured UI for advise → choose → ChangeSpec → prototypes → PR

**Current:** Chat interface with workflow triggers
**Needed:** Multi-step flow:
  1. Question input
  2. Advice & memory display (context used + options)
  3. ChangeSpec panel
  4. Prototype variants (tabs/cards)
  5. PR creation

**Implementation Needed:**
- New UI components for:
  - Context display (documents used)
  - Option cards (A/B/C with rationale)
  - ChangeSpec viewer
  - Prototype variant tabs
  - PR preview links

---

## Architecture Support Assessment

### ✅ Well-Supported

1. **Conversational Interface**
   - ✅ Chat UI with streaming
   - ✅ Tool calling framework
   - ✅ Workflow status tracking

2. **Content System**
   - ✅ File-based content (OKRs, PRDs, transcripts, decisions)
   - ✅ Search function (basic keyword)
   - ✅ Type inference

3. **Workflow System**
   - ✅ Async workflow execution
   - ✅ Design workflow (v0 integration)
   - ✅ Engineering workflow (GitHub PR)

4. **Integrations**
   - ✅ v0 Platform API
   - ✅ GitHub REST API
   - ✅ Workflow API

### ⚠️ Partially Supported

1. **Context Search**
   - ✅ Basic search works
   - ❌ No hybrid search (BM25 + vector)
   - ❌ No structured reasoning

2. **Prototype Generation**
   - ✅ v0 integration works
   - ❌ No ChangeSpec input
   - ❌ No structured variant output

### ❌ Not Supported

1. **Structured Advise**
   - ❌ No `/api/advise` endpoint
   - ❌ No option generation with rationale

2. **ChangeSpec Generation**
   - ❌ No `/api/change-spec` endpoint
   - ❌ No structured spec format

3. **Hybrid Search**
   - ❌ No vector embeddings
   - ❌ No Postgres/pgvector setup

4. **Preview URLs**
   - ❌ No Vercel preview URL extraction

5. **Structured UI Flow**
   - ❌ No multi-step UI for advise → choose → spec → prototype → PR

---

## Implementation Roadmap

### Phase 1: Core Flow (MVP)
1. **Add Advise Step**
   - Create `adviseStep` function in `workflows/chat.ts`
   - LLM call to generate structured options from context
   - Return `AdviseResponse` format

2. **Add ChangeSpec Step**
   - Create `changeSpecStep` function
   - LLM call to generate ChangeSpec from option
   - Return structured `ChangeSpec` JSON

3. **Modify Design Workflow**
   - Accept ChangeSpec as input
   - Compose structured v0 prompt
   - Request 2-3 variants

### Phase 2: Enhanced Search
1. **Set up Hybrid Search**
   - Postgres + pgvector setup
   - Embedding generation for documents
   - SQL query combining BM25 + vector

2. **Tag-based Filtering**
   - Extract tags from questions
   - Filter documents by tags

### Phase 3: UI Flow
1. **Structured UI Components**
   - Context display component
   - Option cards component
   - ChangeSpec viewer
   - Prototype variant tabs

2. **Multi-step Flow**
   - Question → Advise → Choose → ChangeSpec → Prototypes → PR

### Phase 4: Polish
1. **Preview URL Integration**
   - Extract from PR checks
   - Display preview links

2. **Error Handling**
   - Graceful degradation
   - Retry logic

---

## Key Insights

### What Makes FSB Demo Unique

1. **Structured Decision-Making**
   - Not just "generate code"
   - First: advise with options tied to context
   - Then: structured spec from chosen option
   - Finally: prototypes from spec

2. **Institutional Memory**
   - Context search is central
   - Options must be tied to company knowledge
   - ChangeSpec references context used

3. **Rapid Prototyping**
   - Question → PR in < 1 minute
   - Multiple variants for comparison
   - Preview deployments for testing

### Current Architecture Strengths

- ✅ Conversational interface (fits FSB workflow)
- ✅ Async workflows (non-blocking)
- ✅ v0 + GitHub integration (prototype → PR)
- ✅ Content system (foundation for memory)

### Critical Gaps

- ❌ No structured advise step (core differentiator)
- ❌ No ChangeSpec generation (missing structure)
- ❌ No hybrid search (weaker context retrieval)
- ❌ No structured UI flow (harder to demo)

---

## Recommendations

### Immediate (Demo Blockers)
1. **Add Advise Step** - Core to FSB value prop
2. **Add ChangeSpec Generation** - Needed for structured flow
3. **Modify Design Workflow** - Accept ChangeSpec, generate variants

### Short-term (Better Demo)
1. **Structured UI Flow** - Multi-step interface
2. **Preview URL Integration** - Show Vercel previews

### Medium-term (Production Ready)
1. **Hybrid Search** - Better context retrieval
2. **Tag-based Filtering** - More precise context
3. **Error Handling** - Robustness

---

## Conclusion

**Current State:** We have the foundation (chat, workflows, integrations) but missing the structured decision-making layer that makes FSB unique.

**Key Missing Piece:** The advise step that transforms context search into structured options with rationale. This is what differentiates FSB from "just generate code."

**Path Forward:** Add advise → ChangeSpec → structured prototype flow while keeping the conversational interface as the entry point.
