import { initApiPassthrough } from "langgraph-nextjs-api-passthrough";

// This file acts as a secure proxy for requests to your LangGraph server.
// The real LangGraph URL is hidden from the client for security.

// Initialize the secure API passthrough with fallback values for build time
const apiUrl = process.env.LANGGRAPH_API_URL || "http://localhost:2024";
const apiKey = process.env.LANGSMITH_API_KEY || "";

// Validate environment variables at runtime
if (typeof window === 'undefined') { // Server-side only
  if (!process.env.LANGGRAPH_API_URL || process.env.LANGGRAPH_API_URL === "remove-me") {
    console.error("⚠️  LANGGRAPH_API_URL environment variable is not set!");
  }

  if (!process.env.LANGSMITH_API_KEY || process.env.LANGSMITH_API_KEY === "remove-me") {
    console.warn("⚠️  LANGSMITH_API_KEY environment variable is not set. This may be required for some deployments.");
  }
}

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } =
  initApiPassthrough({
    apiUrl,
    apiKey,
    runtime: "edge",
  });

// Log successful initialization (without exposing sensitive data)
console.log("🔒 Secure API proxy initialized successfully");
console.log(`📡 Target server: ${process.env.LANGGRAPH_API_URL ? '[CONFIGURED]' : '[NOT SET]'}`);
console.log(`🔑 API key: ${process.env.LANGSMITH_API_KEY ? '[CONFIGURED]' : '[NOT SET]'}`);
