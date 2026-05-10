import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Sparkles, Cross, Pill, Cloud, Laptop } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "Chat — MedProz" }] }),
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "I have a headache and a runny nose",
  "What can I take for heartburn?",
  "Best meds for muscle pain?",
  "I have a sore throat — what helps?",
];

/** Same clinical guardrails as `supabase/functions/medical-chat` for local parity. */
const OLLAMA_SYSTEM_PROMPT = `You are MedProz, a friendly medical helpline assistant. You help users by:
- Suggesting common over-the-counter medications for symptoms
- Explaining what a medication is used for, typical dosages, and side effects
- Identifying medications from descriptions or photos the user shares
- Helping users track their medications

CRITICAL RULES:
1. ALWAYS include a brief disclaimer that you are not a substitute for a licensed doctor and the user should consult a healthcare professional for serious symptoms.
2. When suggesting a medicine, format the medicine name in **bold** so it stands out.
3. Never recommend prescription drugs without a doctor's input — only suggest common OTC options.
4. For emergencies (chest pain, severe bleeding, difficulty breathing, suicidal thoughts), tell the user to call emergency services immediately.
5. Keep responses concise, warm, and use markdown formatting.`;

const OLLAMA_BASE = (import.meta.env.VITE_OLLAMA_URL as string | undefined)?.replace(/\/$/, "") ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? "medgemma:4b";

function ChatPage() {
  const [onlineMessages, setOnlineMessages] = useState<Msg[]>([]);
  const [onlineInput, setOnlineInput] = useState("");
  const [onlineStreaming, setOnlineStreaming] = useState(false);
  const onlineScrollRef = useRef<HTMLDivElement>(null);

  const [offlineMessages, setOfflineMessages] = useState<Msg[]>([]);
  const [offlineInput, setOfflineInput] = useState("");
  const [offlineStreaming, setOfflineStreaming] = useState(false);
  const offlineScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onlineScrollRef.current?.scrollTo({ top: onlineScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [onlineMessages]);

  useEffect(() => {
    offlineScrollRef.current?.scrollTo({ top: offlineScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [offlineMessages]);

  const sendOnline = async (text: string) => {
    if (!text.trim() || onlineStreaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...onlineMessages, userMsg];
    setOnlineMessages(next);
    setOnlineInput("");
    setOnlineStreaming(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Too many requests. Please wait a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Chat error");
        setOnlineStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";
      setOnlineMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            buf = "";
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setOnlineMessages((p) => p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistantText } : m)));
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setOnlineStreaming(false);
    }
  };

  const sendOffline = async (text: string) => {
    if (!text.trim() || offlineStreaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...offlineMessages, userMsg];
    setOfflineMessages(next);
    setOfflineInput("");
    setOfflineStreaming(true);

    try {
      const resp = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: "system", content: OLLAMA_SYSTEM_PROMPT },
            ...next.map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        toast.error(errText || `Ollama error (${resp.status}). Is Ollama running with ${OLLAMA_MODEL}?`);
        setOfflineStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      setOfflineMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as { message?: { content?: string } };
            const piece = parsed.message?.content;
            if (typeof piece === "string" && piece.length > 0) {
              assistantText += piece;
              setOfflineMessages((p) =>
                p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistantText } : m)),
              );
            }
          } catch {
            /* ignore partial JSON line */
          }
        }
      }
      const tail = buffer.trim();
      if (tail) {
        try {
          const parsed = JSON.parse(tail) as { message?: { content?: string } };
          const piece = parsed.message?.content;
          if (typeof piece === "string" && piece.length > 0) {
            assistantText += piece;
            setOfflineMessages((p) =>
              p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistantText } : m)),
            );
          }
        } catch {
          /* ignore */
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Network error — is Ollama running?");
    } finally {
      setOfflineStreaming(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 grid place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
          <Cross className="size-5" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">MedProz</h1>
          <p className="text-xs text-muted-foreground">Always consult a doctor for serious symptoms</p>
        </div>
      </div>

      <Tabs defaultValue="online" className="flex flex-col flex-1 min-h-0 gap-0">
        <TabsList className="w-full max-w-md grid grid-cols-2 h-10 shrink-0">
          <TabsTrigger value="online" className="gap-2">
            <Cloud className="size-3.5 opacity-80" />
            Online
          </TabsTrigger>
          <TabsTrigger value="offline" className="gap-2">
            <Laptop className="size-3.5 opacity-80" />
            Offline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="flex flex-col flex-1 min-h-0 mt-3 data-[state=inactive]:hidden">
          <p className="text-xs text-muted-foreground mb-2">Cloud AI — same chat as before (Supabase + gateway).</p>
          <Card
            ref={onlineScrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 border-border/60 shadow-card bg-card/60 backdrop-blur min-h-[200px]"
          >
            {onlineMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="size-16 grid place-items-center rounded-2xl bg-primary/10 text-primary mb-4 float-slow">
                  <Sparkles className="size-7" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">How can I help today?</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Describe your symptoms or ask about a medicine — I'll suggest options and remind you when to see a doctor.
                </p>
                <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendOnline(s)}
                      className="text-left text-sm rounded-xl border border-border/60 bg-background hover:bg-accent hover:border-primary/30 transition-colors p-3 flex items-start gap-2"
                    >
                      <Pill className="size-4 text-primary shrink-0 mt-0.5" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {onlineMessages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="size-8 shrink-0 grid place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                    <Cross className="size-4" strokeWidth={2.5} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-sm shadow-soft"
                      : "bg-muted/60 rounded-bl-sm"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-primary prose-ul:my-1 prose-ol:my-1">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
          </Card>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendOnline(onlineInput);
            }}
            className="mt-4 flex gap-2 shrink-0"
          >
            <Input
              value={onlineInput}
              onChange={(e) => setOnlineInput(e.target.value)}
              placeholder="Describe symptoms or ask about a medicine…"
              className="flex-1 h-12 rounded-xl bg-card shadow-soft border-border/60"
              disabled={onlineStreaming}
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 rounded-xl bg-gradient-primary shadow-glow"
              disabled={onlineStreaming || !onlineInput.trim()}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="offline" className="flex flex-col flex-1 min-h-0 mt-3 data-[state=inactive]:hidden">
          <p className="text-xs text-muted-foreground mb-2">
            Local Ollama — <span className="font-medium text-foreground">{OLLAMA_MODEL}</span> at {OLLAMA_BASE}
          </p>
          <Card
            ref={offlineScrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 border-border/60 shadow-card bg-card/60 backdrop-blur min-h-[200px]"
          >
            {offlineMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="size-16 grid place-items-center rounded-2xl bg-primary/10 text-primary mb-4 float-slow">
                  <Laptop className="size-7" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Offline MedProz</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Uses your local Ollama model. Start Ollama and pull <code className="text-xs bg-muted px-1 rounded">{OLLAMA_MODEL}</code> if needed.
                </p>
                <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendOffline(s)}
                      className="text-left text-sm rounded-xl border border-border/60 bg-background hover:bg-accent hover:border-primary/30 transition-colors p-3 flex items-start gap-2"
                    >
                      <Pill className="size-4 text-primary shrink-0 mt-0.5" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {offlineMessages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="size-8 shrink-0 grid place-items-center rounded-lg bg-muted text-foreground border border-border">
                    <Laptop className="size-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-sm shadow-soft"
                      : "bg-muted/60 rounded-bl-sm"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-primary prose-ul:my-1 prose-ol:my-1">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
          </Card>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendOffline(offlineInput);
            }}
            className="mt-4 flex gap-2 shrink-0"
          >
            <Input
              value={offlineInput}
              onChange={(e) => setOfflineInput(e.target.value)}
              placeholder="Ask locally (Ollama)…"
              className="flex-1 h-12 rounded-xl bg-card shadow-soft border-border/60"
              disabled={offlineStreaming}
            />
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              className="h-12 rounded-xl"
              disabled={offlineStreaming || !offlineInput.trim()}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
