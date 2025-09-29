import { validate } from "uuid";
import { getApiKey } from "@/lib/api-key";
import { Thread } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { createClient } from "./client";

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string,
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

// Default values for the form
const DEFAULT_ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID || "agent";

export function ThreadProvider({ children }: { children: ReactNode }) {
  // Get environment variables for fallback
  const envAssistantId: string | undefined = process.env.NEXT_PUBLIC_ASSISTANT_ID;
  
  // Use URL params with env var fallbacks for assistant ID, consistent with StreamProvider
  const [assistantId] = useQueryState("assistantId", {
    defaultValue: envAssistantId || "",
  });
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    // Use the fixed internal proxy API URL, consistent with StreamProvider
    // Convert relative path to absolute URL for LangGraph SDK compatibility
    const apiUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/api`
      : "/api";
    
    // Use the same fallback logic as StreamProvider
    const finalAssistantId = assistantId || envAssistantId || DEFAULT_ASSISTANT_ID;
    
    if (!finalAssistantId) return [];
    const client = createClient(apiUrl, getApiKey() ?? undefined);

    const threads = await client.threads.search({
      metadata: {
        ...getThreadSearchMetadata(finalAssistantId),
      },
      limit: 100,
    });

    return threads;
  }, [assistantId, envAssistantId]); // Add envAssistantId to dependencies

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}
