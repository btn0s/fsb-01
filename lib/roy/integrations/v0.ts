import { createClient } from "v0-sdk";

/**
 * V0 SDK client for generating UI prototypes
 */
export const v0 = createClient({
  apiKey: process.env.V0_API_KEY,
});

