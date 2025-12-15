# FSB Tools vs API Architecture Decision

**Date:** December 14, 2025  
**Question:** Should advise/changeSpec/prototypes be API endpoints or agent tools?

---

## Current Architecture

### Conversational Agent Pattern

- `DurableAgent` with tools (`context`, `workflow`, `status`)
- Agent orchestrates tool calls based on conversation
- Tools are "use step" functions that can be called by the agent
- Streaming responses to chat UI

### PRD Assumption

- Multi-step form UI with separate API endpoints
- `/api/advise` → `/api/change-spec` → `/api/generate-prototypes` → `/api/create-draft-pr`
- Each step triggered by button clicks

---

## Analysis: Tools vs API Endpoints

### Option 1: Agent Tools (Recommended ✅)

**Structure:**

```ts
const tools = {
  context: { /* existing */ },
  advise: {
    description: "Generate structured options (A/B/C) with rationale from context",
    execute: async ({ question }) => adviseStep(question)
  },
  changeSpec: {
    description: "Generate ChangeSpec from chosen option",
    execute: async ({ question, option, contextUsed }) => changeSpecStep(...)
  },
  generatePrototypes: {
    description: "Generate UI prototypes from ChangeSpec",
    execute: async ({ changeSpec }) => prototypeStep(changeSpec)
  },
  workflow: { /* existing, modified */ },
  status: { /* existing */ }
};
```

**Flow:**

```
User: "We're redoing onboarding. What fits our goals?"
  ↓
Agent: *calls advise tool*
  → Uses context tool internally
  → Returns options A/B/C
Agent: "Based on your OKRs and past decisions, here are 3 options..."
  ↓
User: "I like option B"
  ↓
Agent: *calls changeSpec tool*
  → Returns ChangeSpec
Agent: *calls generatePrototypes tool*
  → Returns variants
Agent: "Here's the spec and 3 prototype variants..."
  ↓
User: "Create PR from variant 2"
  ↓
Agent: *calls workflow tool (engineering)*
  → Creates PR
```

**Pros:**

- ✅ Fits conversational interface
- ✅ Agent orchestrates the flow naturally
- ✅ Can combine tools (e.g., advise uses context internally)
- ✅ Streaming responses work naturally
- ✅ Agent can explain reasoning at each step
- ✅ No separate API routes needed
- ✅ Leverages agent's decision-making capabilities

**Cons:**

- ⚠️ Less control over exact flow (agent decides when to call tools)
- ⚠️ Harder to build multi-step form UI (if needed later)

---

### Option 2: Separate API Endpoints

**Structure:**

```ts
// app/api/advise/route.ts
export async function POST(req: Request) {
  const { question } = await req.json();
  return Response.json(await adviseStep(question));
}

// app/api/change-spec/route.ts
export async function POST(req: Request) {
  const { question, option, contextUsed } = await req.json();
  return Response.json(await changeSpecStep(...));
}
```

**Flow:**

```
Frontend: POST /api/advise
  → Shows options
User clicks option
Frontend: POST /api/change-spec → POST /api/generate-prototypes
  → Shows ChangeSpec + prototypes
User clicks "Create PR"
Frontend: POST /api/create-draft-pr
  → Shows PR link
```

**Pros:**

- ✅ Explicit control over flow
- ✅ Easy to build multi-step form UI
- ✅ Can be called independently
- ✅ Matches PRD exactly

**Cons:**

- ❌ Doesn't fit conversational interface
- ❌ Requires separate UI components
- ❌ No agent orchestration/explanation
- ❌ Breaks streaming pattern
- ❌ More API routes to maintain

---

### Option 3: Hybrid (Tools + Optional API)

**Structure:**

- Tools for conversational flow
- API endpoints for programmatic access / multi-step UI

**Pros:**

- ✅ Best of both worlds
- ✅ Conversational interface uses tools
- ✅ Multi-step UI can use APIs

**Cons:**

- ⚠️ More code to maintain
- ⚠️ Two ways to do the same thing

---

## Recommendation: Agent Tools ✅

### Why Tools Make More Sense

1. **Conversational Interface**

   - We're building a chat UI, not a multi-step form
   - Agent can naturally orchestrate: "Let me search context... Here are options... Which do you prefer?"
   - Streaming works seamlessly

2. **Agent Orchestration**

   - Agent can decide when to call `advise` vs `changeSpec`
   - Can combine tools (advise internally uses context)
   - Can explain reasoning: "Based on your Q4 OKRs, I recommend option B because..."

3. **Simpler Architecture**

   - No separate API routes
   - Tools are "use step" functions (workflow-aware)
   - Consistent with existing pattern (`context`, `workflow`, `status`)

4. **Flexibility**
   - Agent can adapt flow based on conversation
   - Can skip steps if user provides more info
   - Can handle edge cases conversationally

### Implementation Pattern

```ts
// workflows/chat.ts

async function adviseStep(question: string) {
  "use step";
  // 1. Get context
  const context = await contextStep(question);

  // 2. LLM call to generate options
  const { generateText } = await import("ai");
  const { openai } = await import("@ai-sdk/openai");

  const result = await generateText({
    model: openai("gpt-4o"),
    system: "You are Roy, a staff PM/tech lead...",
    prompt: `Question: ${question}\n\nContext: ${JSON.stringify(context)}`,
  });

  return JSON.parse(result.text); // AdviseResponse
}

async function changeSpecStep(
  question: string,
  option: AdviseResponse["options"][number],
  contextUsed: AdviseResponse["contextUsed"]
) {
  "use step";
  // LLM call to generate ChangeSpec
  // ...
}

const tools = {
  context: {
    /* existing */
  },
  advise: {
    description:
      "Generate structured options with rationale from company memory",
    inputSchema: z.object({
      question: z.string(),
    }),
    execute: async ({ question }) => adviseStep(question),
  },
  changeSpec: {
    description: "Generate ChangeSpec from chosen option",
    inputSchema: z.object({
      question: z.string(),
      option: z.object({
        /* option schema */
      }),
      contextUsed: z.array(
        z.object({
          /* context schema */
        })
      ),
    }),
    execute: async ({ question, option, contextUsed }) =>
      changeSpecStep(question, option, contextUsed),
  },
  // ... rest
};
```

### When APIs Might Be Needed

**Only if:**

- Building multi-step form UI (separate from chat)
- Need programmatic access (webhooks, integrations)
- Need to expose to external systems

**But:** These can be thin wrappers around the tool functions:

```ts
// app/api/advise/route.ts
export async function POST(req: Request) {
  const { question } = await req.json();
  const result = await adviseStep(question);
  return Response.json(result);
}
```

---

## Updated Architecture

### Tools (Primary Interface)

- `context` - Search company memory
- `advise` - Generate options from context
- `changeSpec` - Generate spec from option
- `generatePrototypes` - Generate UI variants from spec
- `workflow` - Trigger design/engineering workflows
- `status` - Check workflow status

### Workflow Steps (Internal)

- `contextStep` - Search content
- `adviseStep` - Generate options
- `changeSpecStep` - Generate spec
- `prototypeStep` - Generate variants (or modify designWorkflow)
- `workflowStep` - Trigger workflows

### Optional API Routes (If Needed)

- Thin wrappers around tool functions
- For programmatic access or multi-step UI

---

## Conclusion

**Use Agent Tools** ✅

- Fits conversational interface
- Leverages agent orchestration
- Simpler architecture
- Consistent with existing pattern
- Can add API wrappers later if needed

**Implementation:**

1. Add `advise`, `changeSpec`, `generatePrototypes` as tools
2. Keep them as "use step" functions
3. Agent orchestrates the flow conversationally
4. Optionally add API wrappers for programmatic access
