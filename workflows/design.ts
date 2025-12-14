import { v0 } from "@/lib/roy/integrations/v0";

async function createProject() {
  "use step";
  return await v0.projects.create({
    name: `Roy-${Date.now()}`,
  });
}

async function createChat(projectId: string, prompt: string) {
  "use step";
  const chatResponse = await v0.chats.create({
    projectId,
    message: prompt,
  });

  // Handle both response types - if it's a stream response, get the chat by ID
  if ("id" in chatResponse) {
    return chatResponse;
  } else {
    // For stream responses, we need to wait and get the chat
    // For now, assume we get a chat response with id
    throw new Error(
      "Streaming responses not yet fully supported - use non-streaming mode"
    );
  }
}

async function createDeployment(
  projectId: string,
  chatId: string,
  versionId: string
) {
  "use step";
  return await v0.deployments.create({
    projectId,
    chatId,
    versionId,
  });
}

export async function designWorkflow(input: {
  task: string;
  requirements?: string;
}) {
  "use workflow";
  const project = await createProject();

  const prompt = input.requirements
    ? `${input.task}\n\nRequirements: ${input.requirements}`
    : input.task;

  const chat = await createChat(project.id, prompt);

  if (!chat.latestVersion) {
    throw new Error("Chat creation failed - no version available");
  }

  const deployment = await createDeployment(
    project.id,
    chat.id,
    chat.latestVersion.id
  );

  return {
    type: "design",
    previewUrl: deployment.webUrl || "",
    chatId: chat.id,
    projectId: project.id,
    files: chat.latestVersion.files || [],
  };
}
