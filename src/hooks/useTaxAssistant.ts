/**
 * Hook for the AI Tax Assistant — streaming chat with context awareness.
 */
import { useState, useCallback, useRef } from "react";
import type { TaxIssue } from "@/lib/tax-error-engine";

export interface TaxAssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TaxAssistantContext {
  filingType?: string;
  taxYear?: string;
  currentSection?: string;
  currentField?: string;
  fieldLabel?: string;
  fieldValue?: string;
  extractedValue?: string;
  userRole?: string;
  uploadedDocs?: string[];
  errors?: TaxIssue[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tax-assistant`;

export function useTaxAssistant() {
  const [messages, setMessages] = useState<TaxAssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef<TaxAssistantContext>({});
  const modeRef = useRef<"beginner" | "professional">("beginner");

  const setContext = useCallback((ctx: TaxAssistantContext) => {
    contextRef.current = ctx;
  }, []);

  const setMode = useCallback((mode: "beginner" | "professional") => {
    modeRef.current = mode;
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: TaxAssistantMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          context: contextRef.current,
          mode: modeRef.current,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${resp.status})`);
      }

      if (!resp.body) throw new Error("No response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat, setContext, setMode };
}
