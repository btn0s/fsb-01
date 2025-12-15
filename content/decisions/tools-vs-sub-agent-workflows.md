# Tools vs Sub-Agent Workflows: Architecture Decision

**Date:** December 14, 2025  
**Question:** Should advise/changeSpec/prototypes be tools or sub-agent workflows?

---

## Current Architecture Pattern

### Tools (Synchronous, Fast)

```ts
async function contextStep(query: string) {
  "use step"; // ← Part of workflow, but synchronous
  // Quick search, returns immediately
  return searchResults;
}

const tools = {
  context: {
    execute: async ({ query }) => contextStep(query),
  },
};
```

**Characteristics:**

- ✅ Fast (milliseconds to seconds)
- ✅ Synchronous (blocks agent until done)
- ✅ Part of conversation flow
- ✅ Returns results immediately
- ✅ Agent can use results in same turn

### Workflows (Asynchronous, Durable)

```ts
export async function designWorkflow(input: {...}) {
  "use workflow";  // ← Separate durable workflow
  // Long-running: v0 API calls, deployments
  return { previewUrl, files };
}
```

**Characteristics:**

- ✅ Slow (seconds to minutes)
- ✅ Asynchronous (runs in background)
- ✅ Durable (survives timeouts/crashes)
- ✅ Returns workflowId immediately
- ✅ Agent polls for status later

---

## Comparison: Tools vs Sub-Agent Workflows

### Option 1: Tools ✅ (Recommended)

**Structure:**

```ts
async function adviseStep(question: string) {
  "use step";
  const context = await contextStep(question);
  const result = await generateText({...}); // Quick LLM call
  return JSON.parse(result.text);
}

const tools = {
  advise: {
    execute: async ({ question }) => adviseStep(question)
  }
};
```

**Flow:**

```
User: "What should we do for onboarding?"
  ↓
Agent: *calls advise tool* (synchronous, ~2-5 seconds)
  → Uses context tool internally
  → LLM generates options
  → Returns options immediately
Agent: "Based on your OKRs, here are 3 options..."
```

**Pros:**

- ✅ Fast (2-5 seconds for LLM call)
- ✅ Synchronous (agent gets results immediately)
- ✅ Part of conversation (natural flow)
- ✅ Agent can explain reasoning
- ✅ Can combine with other tools
- ✅ Simple (just another tool)

**Cons:**

- ⚠️ Blocks conversation (but acceptable for quick operations)
- ⚠️ Not durable (but fast enough to retry if needed)

---

### Option 2: Sub-Agent Workflows ❌ (Not Recommended)

**Structure:**

```ts
export async function adviseWorkflow(input: { question: string }) {
  "use workflow";
  const context = await contextStep(input.question);
  const result = await generateText({...});
  return JSON.parse(result.text);
}

// Agent calls it via workflow tool
const tools = {
  workflow: {
    execute: async ({ type, ... }) => {
      if (type === "advise") {
        const run = await start(adviseWorkflow, [input]);
        return { workflowId: run.runId };
      }
    }
  }
};
```

**Flow:**

```
User: "What should we do for onboarding?"
  ↓
Agent: *calls workflow tool* (returns workflowId immediately)
Agent: "Working on it... [workflowId: abc123]"
  ↓
[Workflow runs in background]
  ↓
Agent: *polls status* → Gets results
Agent: "Here are 3 options..."
```

**Pros:**

- ✅ Durable (survives crashes)
- ✅ Can be long-running (but not needed here)

**Cons:**

- ❌ Overkill (2-5 second operation doesn't need durability)
- ❌ Breaks conversation flow (polling pattern)
- ❌ More complex (workflow orchestration)
- ❌ Slower UX (can't show results immediately)
- ❌ Agent can't explain reasoning naturally

---

## When to Use Each Pattern

### Use Tools When:

- ✅ Operation is fast (< 10 seconds)
- ✅ Should be part of conversation flow
- ✅ Results needed immediately
- ✅ Synchronous execution is acceptable
- ✅ Examples: `context`, `advise`, `changeSpec`, `generatePrototypes`

### Use Workflows When:

- ✅ Operation is slow (> 10 seconds)
- ✅ Should run in background
- ✅ Needs durability (survive crashes/timeouts)
- ✅ Can poll for status later
- ✅ Examples: `designWorkflow`, `engineeringWorkflow`

---

## FSB Flow: Tools Make Sense ✅

### adviseStep

- **Operation:** LLM call to generate options
- **Time:** ~2-5 seconds
- **Pattern:** Tool ✅
- **Reason:** Fast, part of conversation, needs immediate results

### changeSpecStep

- **Operation:** LLM call to generate ChangeSpec
- **Time:** ~2-5 seconds
- **Pattern:** Tool ✅
- **Reason:** Fast, part of conversation, needs immediate results

### generatePrototypesStep

- **Operation:** v0 API call (could be slow)
- **Time:** ~10-30 seconds
- **Pattern:** Tool or Workflow? 🤔
- **Reason:** Could go either way, but if it's part of FSB flow, tool might be better

**Decision:** Keep as tool, but if v0 is slow, could move to workflow later.

---

## Updated Architecture

### Tools (Fast, Synchronous)

```ts
const tools = {
  context: {
    /* existing */
  },
  advise: {
    execute: async ({ question }) => adviseStep(question),
  },
  changeSpec: {
    execute: async ({ question, option, contextUsed }) =>
      changeSpecStep(question, option, contextUsed),
  },
  generatePrototypes: {
    execute: async ({ changeSpec }) => prototypeStep(changeSpec),
  },
  workflow: {
    /* existing - triggers async workflows */
  },
  status: {
    /* existing */
  },
};
```

### Workflows (Slow, Async)

```ts
// Only for truly long-running tasks
export async function designWorkflow(...) { "use workflow"; }
export async function engineeringWorkflow(...) { "use workflow"; }
```

---

## Key Insight

**The distinction isn't about "what it does" but "how long it takes":**

- **Fast (< 10s)** → Tool (synchronous, immediate results)
- **Slow (> 10s)** → Workflow (async, poll for status)

**For FSB flow:**

- `advise` = Fast LLM call → Tool ✅
- `changeSpec` = Fast LLM call → Tool ✅
- `generatePrototypes` = Medium v0 call → Tool (or workflow if too slow) ✅
- `createPR` = Already a workflow → Workflow ✅

---

## Conclusion

**Use Tools** ✅

- FSB steps (`advise`, `changeSpec`, `generatePrototypes`) are fast operations
- They should be part of the conversation flow
- Tools provide immediate results and natural agent orchestration
- Sub-agent workflows would be overkill and break the flow

**Only use workflows for:**

- Long-running operations (v0 generation, GitHub PRs)
- Operations that need durability
- Operations that can run in background
