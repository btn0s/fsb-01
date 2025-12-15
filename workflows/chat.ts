import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import type { ModelMessage, UIMessageChunk } from "ai";
import { z } from "zod";
import { ROY_SYSTEM_PROMPT } from "@/lib/roy/system-prompt";
import { generateText } from "ai";

// === TYPES ===
type AdviseResponse = {
  contextUsed: {
    id: string;
    title: string;
    type: string;
    reason: string;
  }[];
  options: {
    id: "A" | "B" | "C";
    label: string;
    description: string;
    rationale: string;
    risks: string[];
    recommended: boolean;
  }[];
};

type ChangeSpec = {
  title: string;
  summary: string;
  user_story: string;
  acceptance_criteria: string[];
  surfaces: ("web" | "mobile")[];
  target_route?: string;
  target_components?: string[];
  constraints?: string[];
  metrics_focus?: string[];
  priority?: "now" | "next" | "later";
  variants?: string[]; // Variant names/descriptions
};

// === CONTEXT ===
async function contextStep(query: string) {
  "use step";
  const { searchContent, getContentByType } = await import("@/lib/roy/content");

  const searchResults = searchContent(query, 5);
  const tasks = getContentByType("task");
  const okrs = getContentByType("okr");

  return {
    search: searchResults.map((r) => ({
      type: r.file.type,
      title: r.file.title || r.file.filename,
      snippet: r.snippet,
    })),
    tasks: tasks.map((t) => ({ title: t.title || t.filename })),
    okrs: okrs.map((o) => ({ title: o.title || o.filename })),
  };
}

// === WORKFLOW ===
async function workflowStep(
  type: "design" | "engineering",
  task: string,
  options?: { requirements?: string; files?: string[] }
) {
  "use step";
  const { start } = await import("workflow/api");

  if (type === "design") {
    const { designWorkflow } = await import("@/workflows/design");
    const run = await start(designWorkflow, [
      { task, requirements: options?.requirements },
    ]);
    return { workflowId: run.runId, type: "design" };
  }

  const { engineeringWorkflow } = await import("@/workflows/engineering");
  const run = await start(engineeringWorkflow, [
    { task, targetFiles: options?.files },
  ]);
  return { workflowId: run.runId, type: "engineering" };
}

async function statusStep(workflowId: string) {
  "use step";
  const { getRun } = await import("workflow/api");
  const run = await getRun(workflowId);
  return { status: run.status, result: run.returnValue };
}

// === ADVISE ===
async function adviseStep(
  question: string,
  context?: any
): Promise<AdviseResponse> {
  "use step";
  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "workflows/chat.ts:93",
      message: "adviseStep entry",
      data: { question, hasContext: !!context },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion

  let ctx: any;
  try {
    // If context not provided, get it
    ctx = context || (await contextStep(question));
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "workflows/chat.ts:99",
        message: "contextStep completed",
        data: {
          contextKeys: Object.keys(ctx),
          searchCount: ctx?.search?.length,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }),
    }).catch(() => {});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "workflows/chat.ts:99",
        message: "contextStep failed",
        data: { error: String(error) },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }

  let result: any;
  try {
    result = await generateText({
      model: "openai/gpt-4o",
      system: `You are Roy, a staff PM/tech lead with access to company memory. 
Generate structured options (A/B/C) with rationale tied to the retrieved context.
Each option should reference specific context documents and explain why it's relevant.
Mark one option as recommended based on company goals and constraints.`,
      prompt: `Question: ${question}

Context retrieved from company memory:
${JSON.stringify(ctx, null, 2)}

Generate 2-3 options (A, B, C) with:
- label: Short name
- description: What this option entails
- rationale: Why this option makes sense given the context (reference specific documents)
- risks: Potential downsides
- recommended: true for the best option

Return JSON matching this structure:
{
  "contextUsed": [
    {"id": "1", "title": "...", "type": "...", "reason": "why relevant"}
  ],
  "options": [
    {"id": "A", "label": "...", "description": "...", "rationale": "...", "risks": [...], "recommended": true/false}
  ]
}`,
    });
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "workflows/chat.ts:101",
        message: "generateText completed",
        data: {
          textLength: result?.text?.length,
          textPreview: result?.text?.substring(0, 200),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "workflows/chat.ts:101",
        message: "generateText failed",
        data: { error: String(error) },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }

  try {
    // Try to extract JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as AdviseResponse;
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "workflows/chat.ts:130",
            message: "JSON parse success (regex)",
            data: {
              optionsCount: parsed?.options?.length,
              contextUsedCount: parsed?.contextUsed?.length,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }
      ).catch(() => {});
      // #endregion
      return parsed;
    }
    const parsed = JSON.parse(result.text) as AdviseResponse;
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "workflows/chat.ts:136",
        message: "JSON parse success (direct)",
        data: {
          optionsCount: parsed?.options?.length,
          contextUsedCount: parsed?.contextUsed?.length,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    return parsed;
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "workflows/chat.ts:137",
        message: "JSON parse failed",
        data: {
          error: String(error),
          textPreview: result?.text?.substring(0, 500),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    throw new Error(`Failed to parse advise response: ${result.text}`);
  }
}

// === CHANGE SPEC ===
async function changeSpecStep(
  question: string,
  option: AdviseResponse["options"][number],
  contextUsed: AdviseResponse["contextUsed"]
): Promise<ChangeSpec> {
  "use step";

  const result = await generateText({
    model: "openai/gpt-4o",
    system: `You are Roy, a staff PM/tech lead. Generate a structured ChangeSpec from the chosen option.
The ChangeSpec should be detailed enough to generate UI prototypes.`,
    prompt: `Question: ${question}

Chosen Option:
- Label: ${option.label}
- Description: ${option.description}
- Rationale: ${option.rationale}

Context Used:
${JSON.stringify(contextUsed, null, 2)}

Generate a ChangeSpec JSON with:
- title: Short descriptive title
- summary: 2-3 sentence summary
- user_story: As a [user], I want [goal] so that [benefit]
- acceptance_criteria: Array of specific, testable criteria
- surfaces: ["web"] or ["mobile"] or ["web", "mobile"]
- target_route: Optional route path (e.g., "/onboarding")
- target_components: Optional component names
- constraints: Array of technical/business constraints
- metrics_focus: Array of metrics this addresses
- priority: "now" | "next" | "later"
- variants: Array of variant names/descriptions (e.g., ["wizard", "checklist", "conversational"])

Return ONLY valid JSON, no markdown formatting.`,
  });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ChangeSpec;
    }
    return JSON.parse(result.text) as ChangeSpec;
  } catch (error) {
    throw new Error(`Failed to parse ChangeSpec: ${result.text}`);
  }
}

// === GENERATE PROTOTYPE (ONE per variation) ===
async function generatePrototypeStep(changeSpec: ChangeSpec, variant?: string) {
  "use step";
  const { v0 } = await import("@/lib/roy/integrations/v0");

  // Create v0 project
  const project = await v0.projects.create({
    name: `Roy-${Date.now()}-${variant || "default"}`,
  });

  // Compose prompt for v0
  const variantPrompt = variant
    ? `\n\nFocus on the "${variant}" variant approach.`
    : "";

  const v0Prompt = `Generate a UI prototype for: ${changeSpec.title}

Summary: ${changeSpec.summary}
User Story: ${changeSpec.user_story}

Acceptance Criteria:
${changeSpec.acceptance_criteria.map((ac) => `- ${ac}`).join("\n")}

Surfaces: ${changeSpec.surfaces.join(", ")}
${changeSpec.target_route ? `Target Route: ${changeSpec.target_route}` : ""}
${
  changeSpec.constraints
    ? `Constraints: ${changeSpec.constraints.join(", ")}`
    : ""
}
${variantPrompt}

Tech stack: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui components.
Generate clean, production-ready UI code.`;

  // Create v0 chat
  const chatResponse = await v0.chats.create({
    projectId: project.id,
    message: v0Prompt,
  });

  if (!("id" in chatResponse)) {
    throw new Error("v0 chat creation failed - streaming not supported");
  }

  const chat = chatResponse;

  if (!chat.latestVersion) {
    throw new Error("Chat creation failed - no version available");
  }

  // Create deployment
  const deployment = await v0.deployments.create({
    projectId: project.id,
    chatId: chat.id,
    versionId: chat.latestVersion.id,
  });

  return {
    variant: variant || "default",
    previewUrl: deployment.webUrl || "",
    chatId: chat.id,
    projectId: project.id,
    files: chat.latestVersion.files || [],
  };
}

// === TOOLS (DurableAgent format with inputSchema) ===
const tools = {
  context: {
    description:
      "Search and retrieve relevant context from OKRs, PRDs, tasks, transcripts, and decisions.",
    inputSchema: z.object({
      query: z.string().describe("What to search for"),
    }),
    execute: async ({ query }: { query: string }) => contextStep(query),
  },
  advise: {
    description:
      "Generate structured options (A/B/C) with rationale from company memory. Use when user needs decision-making help.",
    inputSchema: z.object({
      question: z.string().describe("The question or decision to advise on"),
    }),
    execute: async ({ question }: { question: string }) => adviseStep(question),
  },
  changeSpec: {
    description:
      "Generate a ChangeSpec (structured specification) from a chosen option. Use after advise tool when user picks an option.",
    inputSchema: z.object({
      question: z.string(),
      option: z.object({
        id: z.enum(["A", "B", "C"]),
        label: z.string(),
        description: z.string(),
        rationale: z.string(),
        risks: z.array(z.string()),
        recommended: z.boolean(),
      }),
      contextUsed: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          type: z.string(),
          reason: z.string(),
        })
      ),
    }),
    execute: async ({
      question,
      option,
      contextUsed,
    }: {
      question: string;
      option: AdviseResponse["options"][number];
      contextUsed: AdviseResponse["contextUsed"];
    }) => changeSpecStep(question, option, contextUsed),
  },
  generatePrototype: {
    description:
      "Generate ONE v0 prototype from a ChangeSpec. Use to create a single UI prototype variant. If ChangeSpec has multiple variants, call this tool once per variant.",
    inputSchema: z.object({
      changeSpec: z.object({
        title: z.string(),
        summary: z.string(),
        user_story: z.string(),
        acceptance_criteria: z.array(z.string()),
        surfaces: z.array(z.enum(["web", "mobile"])),
        target_route: z.string().optional(),
        target_components: z.array(z.string()).optional(),
        constraints: z.array(z.string()).optional(),
        metrics_focus: z.array(z.string()).optional(),
        priority: z.enum(["now", "next", "later"]).optional(),
        variants: z.array(z.string()).optional(),
      }),
      variant: z
        .string()
        .optional()
        .describe(
          "Variant name/description if ChangeSpec has multiple variants"
        ),
    }),
    execute: async ({
      changeSpec,
      variant,
    }: {
      changeSpec: ChangeSpec;
      variant?: string;
    }) => generatePrototypeStep(changeSpec, variant),
  },
  workflow: {
    description:
      "Start a long-running workflow. Use 'design' for UI prototypes, 'engineering' for code/PRs.",
    inputSchema: z.object({
      type: z.enum(["design", "engineering"]),
      task: z.string().describe("What to build"),
      requirements: z
        .string()
        .optional()
        .describe("For design: specific requirements"),
      files: z
        .array(z.string())
        .optional()
        .describe("For engineering: files to modify"),
    }),
    execute: async ({
      type,
      task,
      requirements,
      files,
    }: {
      type: "design" | "engineering";
      task: string;
      requirements?: string;
      files?: string[];
    }) => workflowStep(type, task, { requirements, files }),
  },
  status: {
    description: "Check the status of a running workflow.",
    inputSchema: z.object({
      workflowId: z.string(),
    }),
    execute: async ({ workflowId }: { workflowId: string }) =>
      statusStep(workflowId),
  },
};

export async function royChatWorkflow(messages: ModelMessage[]) {
  "use workflow";

  const writable = getWritable<UIMessageChunk>();

  const agent = new DurableAgent({
    model: "openai/gpt-4o",
    system: ROY_SYSTEM_PROMPT,
    tools,
  });

  await agent.stream({
    messages,
    writable,
  });
}
