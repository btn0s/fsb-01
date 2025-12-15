# FSB Multi-Step Prototype Flow Architecture

**Date:** December 14, 2025  
**Goal:** Agent automatically orchestrates context → planning → prototype generation

---

## Desired Flow

```
User: "generate a ROY prototype"
  ↓
Agent automatically orchestrates:
  1. Context search (company memory)
  2. Advise (generate options A/B/C)
  3. ChangeSpec (from recommended option)
  4. Generate prototypes (ONE v0 prototype per variation)
```

**Key Requirements:**

- ✅ Agent orchestrates all steps automatically
- ✅ No user input needed between steps
- ✅ One v0 prototype per variation (not all at once)
- ✅ Context → Planning → Prototype sequence

---

## Architecture Options

### Option 1: Single Orchestration Tool ✅ (Recommended)

**Structure:**

```ts
async function generateRoyPrototypeStep(
  question: string,
  options?: { autoSelectRecommended?: boolean }
) {
  "use step";

  // Step 1: Context
  const context = await contextStep(question);

  // Step 2: Advise (generate options)
  const adviseResult = await adviseStep(question, context);

  // Step 3: Auto-select recommended option (or use first)
  const selectedOption = options?.autoSelectRecommended
    ? adviseResult.options.find((o) => o.recommended) || adviseResult.options[0]
    : adviseResult.options[0];

  // Step 4: ChangeSpec
  const changeSpec = await changeSpecStep(
    question,
    selectedOption,
    adviseResult.contextUsed
  );

  // Step 5: Generate ONE prototype per variation
  const prototypes = [];
  for (const variant of changeSpec.variants || ["default"]) {
    const prototype = await generatePrototypeStep(changeSpec, variant);
    prototypes.push(prototype);
  }

  return {
    context: adviseResult.contextUsed,
    options: adviseResult.options,
    selectedOption,
    changeSpec,
    prototypes, // Array of v0 prototypes (one per variation)
  };
}

const tools = {
  generateRoyPrototype: {
    description:
      "Generate a ROY prototype: searches context, generates options, creates ChangeSpec, and generates v0 prototypes",
    inputSchema: z.object({
      question: z.string().describe("What to prototype"),
      autoSelectRecommended: z.boolean().optional().default(true),
    }),
    execute: async ({ question, autoSelectRecommended }) =>
      generateRoyPrototypeStep(question, { autoSelectRecommended }),
  },
};
```

**Flow:**

```
User: "generate a ROY prototype for onboarding"
  ↓
Agent: *calls generateRoyPrototype tool*
  → Context search
  → Advise (options)
  → ChangeSpec (from recommended)
  → Generate prototypes (one per variation)
  → Returns all results
Agent: "Based on your OKRs, I generated 3 prototype variants..."
```

**Pros:**

- ✅ Single tool call
- ✅ Agent orchestrates automatically
- ✅ All steps in sequence
- ✅ One prototype per variation
- ✅ Can still expose individual tools if needed

**Cons:**

- ⚠️ Less flexible (can't pause between steps)
- ⚠️ Can't show intermediate results

---

### Option 2: Agent Orchestration (Multiple Tool Calls)

**Structure:**

```ts
// Keep individual tools
const tools = {
  context: {
    /* existing */
  },
  advise: {
    /* new */
  },
  changeSpec: {
    /* new */
  },
  generatePrototype: {
    /* new - generates ONE prototype */
  },
  generateRoyPrototype: {
    /* orchestration tool */
  },
};
```

**Flow:**

```
User: "generate a ROY prototype"
  ↓
Agent: *calls generateRoyPrototype tool*
  → Internally calls: context → advise → changeSpec → generatePrototype (per variant)
  → Returns all results
```

**Or agent could chain tools:**

```
User: "generate a ROY prototype"
  ↓
Agent: *calls context tool*
Agent: *calls advise tool*
Agent: *calls changeSpec tool* (auto-selects recommended)
Agent: *calls generatePrototype tool* (for each variation)
```

**Pros:**

- ✅ More flexible (can show intermediate steps)
- ✅ Agent can explain reasoning at each step
- ✅ Can pause if needed

**Cons:**

- ⚠️ Multiple tool calls (slower)
- ⚠️ Agent might not chain correctly
- ⚠️ More complex orchestration

---

### Option 3: Workflow Orchestration

**Structure:**

```ts
export async function generateRoyPrototypeWorkflow(input: {
  question: string;
  autoSelectRecommended?: boolean;
}) {
  "use workflow";

  // Step 1: Context
  const context = await contextStep(input.question);

  // Step 2: Advise
  const adviseResult = await adviseStep(input.question, context);

  // Step 3: ChangeSpec
  const selectedOption =
    adviseResult.options.find((o) => o.recommended) || adviseResult.options[0];
  const changeSpec = await changeSpecStep(
    input.question,
    selectedOption,
    adviseResult.contextUsed
  );

  // Step 4: Generate prototypes (one per variation)
  const prototypes = [];
  for (const variant of changeSpec.variants || ["default"]) {
    const prototype = await generatePrototypeStep(changeSpec, variant);
    prototypes.push(prototype);
  }

  return {
    context: adviseResult.contextUsed,
    options: adviseResult.options,
    selectedOption,
    changeSpec,
    prototypes,
  };
}
```

**Pros:**

- ✅ Durable (survives crashes)
- ✅ Can be long-running

**Cons:**

- ❌ Overkill (should be fast enough as tool)
- ❌ Breaks conversation flow
- ❌ Polling pattern

---

## Recommendation: Option 1 (Single Orchestration Tool) ✅

### Implementation

```ts
// workflows/chat.ts

// Individual steps (can be called separately if needed)
async function contextStep(query: string) {
  "use step";
  // ... existing implementation
}

async function adviseStep(question: string, context?: any) {
  "use step";
  // If context not provided, get it
  const ctx = context || (await contextStep(question));

  // LLM call to generate options
  const { generateText } = await import("ai");
  const { openai } = await import("@ai-sdk/openai");

  const result = await generateText({
    model: openai("gpt-4o"),
    system: "You are Roy, a staff PM/tech lead...",
    prompt: `Question: ${question}\n\nContext: ${JSON.stringify(ctx)}`,
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

async function generatePrototypeStep(changeSpec: ChangeSpec, variant?: string) {
  "use step";
  // Generate ONE v0 prototype
  // Calls v0 API, returns single prototype
  // ...
}

// Orchestration tool
async function generateRoyPrototypeStep(
  question: string,
  options?: { autoSelectRecommended?: boolean }
) {
  "use step";

  // Step 1: Context
  const context = await contextStep(question);

  // Step 2: Advise
  const adviseResult = await adviseStep(question, context);

  // Step 3: Select option
  const selectedOption =
    options?.autoSelectRecommended !== false
      ? adviseResult.options.find((o) => o.recommended) ||
        adviseResult.options[0]
      : adviseResult.options[0];

  // Step 4: ChangeSpec
  const changeSpec = await changeSpecStep(
    question,
    selectedOption,
    adviseResult.contextUsed
  );

  // Step 5: Generate prototypes (one per variation)
  const variants = changeSpec.variants || ["default"];
  const prototypes = [];

  for (const variant of variants) {
    const prototype = await generatePrototypeStep(changeSpec, variant);
    prototypes.push(prototype);
  }

  return {
    context: adviseResult.contextUsed,
    options: adviseResult.options,
    selectedOption,
    changeSpec,
    prototypes, // Array: one v0 prototype per variation
  };
}

const tools = {
  context: {
    description: "Search company memory",
    execute: async ({ query }) => contextStep(query),
  },
  advise: {
    description: "Generate structured options from context",
    execute: async ({ question }) => adviseStep(question),
  },
  changeSpec: {
    description: "Generate ChangeSpec from option",
    execute: async ({ question, option, contextUsed }) =>
      changeSpecStep(question, option, contextUsed),
  },
  generatePrototype: {
    description: "Generate ONE v0 prototype from ChangeSpec",
    execute: async ({ changeSpec, variant }) =>
      generatePrototypeStep(changeSpec, variant),
  },
  generateRoyPrototype: {
    description:
      "Full ROY prototype flow: context → advise → changeSpec → prototypes (one per variation)",
    inputSchema: z.object({
      question: z.string(),
      autoSelectRecommended: z.boolean().optional().default(true),
    }),
    execute: async ({ question, autoSelectRecommended }) =>
      generateRoyPrototypeStep(question, { autoSelectRecommended }),
  },
};
```

---

## Key Design Decisions

### 1. One Prototype Per Variation

- `generatePrototypeStep` generates ONE v0 prototype
- Orchestration tool loops through variants
- Each variant gets its own v0 project/chat/deployment

### 2. Auto-Select Recommended Option

- Default: auto-select recommended option
- Can disable: `autoSelectRecommended: false`
- Falls back to first option if none recommended

### 3. Individual Tools Still Available

- Can call `context`, `advise`, `changeSpec`, `generatePrototype` separately
- Orchestration tool uses them internally
- Flexibility for different use cases

### 4. Sequential Execution

- All steps run in sequence (synchronous)
- Agent gets all results at once
- Can explain entire flow naturally

---

## Example Usage

### Full Orchestration (Recommended)

```
User: "generate a ROY prototype for onboarding"
Agent: *calls generateRoyPrototype tool*
Agent: "Based on your Q4 OKRs and past decisions, I generated 3 prototype variants:
  1. Wizard approach (recommended)
  2. Checklist approach
  3. Conversational approach

  Here are the prototypes:
  - Variant 1: https://v0.dev/preview/abc123
  - Variant 2: https://v0.dev/preview/def456
  - Variant 3: https://v0.dev/preview/ghi789"
```

### Step-by-Step (If Needed)

```
User: "What options do we have for onboarding?"
Agent: *calls advise tool*
Agent: "Here are 3 options..."

User: "I like option B"
Agent: *calls changeSpec tool*
Agent: *calls generatePrototype tool* (for each variant)
```

---

## Implementation Checklist

- [ ] Create `adviseStep` function
- [ ] Create `changeSpecStep` function
- [ ] Create `generatePrototypeStep` function (generates ONE prototype)
- [ ] Create `generateRoyPrototypeStep` orchestration function
- [ ] Add tools to agent
- [ ] Update system prompt to explain `generateRoyPrototype` tool
- [ ] Test full flow end-to-end

---

## Conclusion

**Use Single Orchestration Tool** ✅

- Agent calls `generateRoyPrototype` tool
- Tool internally orchestrates: context → advise → changeSpec → prototypes
- One v0 prototype per variation
- All steps sequential, automatic
- Individual tools still available for flexibility
