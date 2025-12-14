import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import type { ContentFile, ContentType, SearchResult } from "./types";

const CONTENT_DIR = join(process.cwd(), "content");

/**
 * Infer content type from file path
 */
function inferType(filePath: string): ContentType {
  if (filePath.includes("/okrs/")) return "okr";
  if (filePath.includes("/prds/")) return "prd";
  if (filePath.includes("/transcripts/")) return "transcript";
  if (filePath.includes("/tasks/")) return "task";
  if (filePath.includes("/decisions/")) return "decision";
  return "unknown";
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1];
}

/**
 * Recursively get all markdown files in a directory
 */
function getMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Load all content files from the content directory
 */
export function loadAllContent(): ContentFile[] {
  const files = getMarkdownFiles(CONTENT_DIR);

  return files.map((filePath) => {
    const content = readFileSync(filePath, "utf-8");
    const relativePath = filePath.replace(CONTENT_DIR + "/", "");

    return {
      path: relativePath,
      filename: basename(filePath),
      type: inferType(filePath),
      content,
      title: extractTitle(content),
    };
  });
}

/**
 * Simple keyword-based search across content files
 * For demo purposes - could be enhanced with embeddings
 */
export function searchContent(
  query: string,
  limit: number = 5
): SearchResult[] {
  const files = loadAllContent();
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean);

  const results: SearchResult[] = [];

  for (const file of files) {
    const contentLower = file.content.toLowerCase();
    const titleLower = (file.title || "").toLowerCase();

    // Calculate relevance based on term matches
    let relevance = 0;
    for (const term of queryTerms) {
      // Title matches are worth more
      if (titleLower.includes(term)) {
        relevance += 10;
      }
      // Count content matches
      const matches = (contentLower.match(new RegExp(term, "g")) || []).length;
      relevance += matches;
    }

    if (relevance > 0) {
      // Extract a relevant snippet
      const snippet = extractSnippet(file.content, queryTerms);
      results.push({ file, snippet, relevance });
    }
  }

  // Sort by relevance and limit
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
}

/**
 * Extract a relevant snippet from content
 */
function extractSnippet(content: string, terms: string[]): string {
  const lines = content.split("\n");

  // Find the first line that contains any of the terms
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (terms.some((term) => lineLower.includes(term))) {
      // Return this line and the next few for context
      const idx = lines.indexOf(line);
      return lines
        .slice(idx, idx + 3)
        .join("\n")
        .slice(0, 300);
    }
  }

  // Fallback to first few lines
  return lines.slice(0, 3).join("\n").slice(0, 300);
}

/**
 * Get all content as a formatted string for context
 */
export function getAllContentForContext(): string {
  const files = loadAllContent();

  return files
    .map((f) => {
      return `--- ${f.type.toUpperCase()}: ${f.title || f.filename} ---\n${
        f.content
      }`;
    })
    .join("\n\n");
}

/**
 * Get content by type
 */
export function getContentByType(type: ContentType): ContentFile[] {
  return loadAllContent().filter((f) => f.type === type);
}
