import { tool } from "ai";
import { z } from "zod";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { searchContent, getContentByType } from "@/lib/roy/content";
import { start, getRun } from "workflow/api";
import { designWorkflow } from "@/workflows/design";
import { engineeringWorkflow } from "@/workflows/engineering";

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
  variants?: string[];
};

// === CONTEXT ===
async function contextFunction(query: string) {
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

// === ADVISE ===
async function adviseFunction(
  question: string,
  context?: any
): Promise<AdviseResponse> {
  let ctx: any;
  try {
    // If context not provided, get it
    ctx = context || (await contextFunction(question));
  } catch (error) {
    throw error;
  }

  let result: any;
  try {
    result = await generateText({
      model: openai("gpt-4o"),
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
  } catch (error) {
    throw error;
  }

  try {
    // Try to extract JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as AdviseResponse;
      return parsed;
    }
    const parsed = JSON.parse(result.text) as AdviseResponse;
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse advise response: ${result.text}`);
  }
}

// === CHANGE SPEC ===
async function changeSpecFunction(
  question: string,
  option: AdviseResponse["options"][number],
  contextUsed: AdviseResponse["contextUsed"]
): Promise<ChangeSpec> {
  const result = await generateText({
    model: openai("gpt-4o"),
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

// === GENERATE PROTOTYPE ===
async function generatePrototypeFunction(
  changeSpec: ChangeSpec,
  variant?: string
) {
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

// === WORKFLOW ===
async function workflowFunction(
  type: "design" | "engineering",
  task: string,
  options?: { requirements?: string; files?: string[] }
) {
  if (type === "design") {
    const run = await start(designWorkflow, [
      { task, requirements: options?.requirements },
    ]);
    return { workflowId: run.runId, type: "design" };
  }

  const run = await start(engineeringWorkflow, [
    { task, targetFiles: options?.files },
  ]);
  return { workflowId: run.runId, type: "engineering" };
}

async function statusFunction(workflowId: string) {
  const run = await getRun(workflowId);
  return { status: run.status, result: run.returnValue };
}

// === TOOLS (AI SDK format) ===
export const chatTools = {
  context: tool({
    description:
      "Search and retrieve relevant context from OKRs, PRDs, tasks, transcripts, and decisions.",
    parameters: z.object({
      query: z.string().describe("What to search for"),
    }),
    execute: async ({ query }) => contextFunction(query),
  }),

  advise: tool({
    description:
      "Generate structured options (A/B/C) with rationale from company memory. Use when user needs decision-making help.",
    parameters: z.object({
      question: z.string().describe("The question or decision to advise on"),
    }),
    execute: async ({ question }) => adviseFunction(question),
  }),

  changeSpec: tool({
    description:
      "Generate a ChangeSpec (structured specification) from a chosen option. Use after advise tool when user picks an option.",
    parameters: z.object({
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
    execute: async ({ question, option, contextUsed }) =>
      changeSpecFunction(question, option, contextUsed),
  }),

  generatePrototype: tool({
    description:
      "Generate ONE v0 prototype from a ChangeSpec. Use to create a single UI prototype variant. If ChangeSpec has multiple variants, call this tool once per variant.",
    parameters: z.object({
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
    execute: async ({ changeSpec, variant }) =>
      generatePrototypeFunction(changeSpec, variant),
  }),

  workflow: tool({
    description:
      "Start a long-running workflow. Use 'design' for UI prototypes, 'engineering' for code/PRs.",
    parameters: z.object({
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
    execute: async ({ type, task, requirements, files }) =>
      workflowFunction(type, task, { requirements, files }),
  }),

  status: tool({
    description: "Check the status of a running workflow.",
    parameters: z.object({
      workflowId: z.string(),
    }),
    execute: async ({ workflowId }) => statusFunction(workflowId),
  }),
};
