"use client";

import { ExternalLink, Link2, MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  localName: string;
  selectedPeerName: string | null;
  onSendText: (text: string) => void | Promise<void>;
  onSendLink: (url: string) => void | Promise<void>;
  disabled?: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatPanel({
  messages,
  localName,
  selectedPeerName,
  onSendText,
  onSendLink,
  disabled,
}: ChatPanelProps) {
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lastMessageId]);

  const submitText = async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || sending) return;
    setSending(true);
    try {
      await onSendText(trimmed);
      setText("");
    } finally {
      setSending(false);
    }
  };

  const submitLink = async () => {
    const trimmed = link.trim();
    if (!trimmed || disabled || sending) return;
    setSending(true);
    try {
      await onSendLink(trimmed);
      setLink("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-border/40 bg-muted/10">
      <div className="flex items-center justify-between gap-2 px-5 py-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          Messages
        </p>
        <span className="truncate text-[11px] text-muted-foreground">
          {selectedPeerName ? `with ${selectedPeerName}` : "All peers"}
        </span>
      </div>

      <ScrollArea className="mx-4 mb-3 h-44 rounded-2xl border border-border/40 bg-background/60 shadow-inner md:h-52">
        <div className="space-y-2 p-3">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No messages yet. Say hello to your peer.
            </p>
          ) : (
            messages.map((m) => {
              const isOut = m.direction === "outgoing";
              return (
                <div
                  key={m.id}
                  className={cn("flex", isOut ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      isOut
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md bg-muted text-foreground"
                    )}
                  >
                    <p className="mb-0.5 text-[10px] font-medium opacity-80">
                      {isOut ? localName : m.peerName} · {formatTime(m.timestamp)}
                    </p>
                    {m.type === "link" ? (
                      <a
                        href={m.data}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 break-all underline underline-offset-2",
                          isOut ? "text-primary-foreground" : "text-primary"
                        )}
                      >
                        <Link2 className="h-3.5 w-3.5 shrink-0" />
                        {m.data}
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </a>
                    ) : (
                      <p className="whitespace-pre-wrap break-words leading-snug">{m.data}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="px-5 pb-4">
        <Tabs defaultValue="text">
          <TabsList className="mb-2 h-9 w-full rounded-xl bg-muted/50 p-0.5">
            <TabsTrigger value="text" className="flex-1 rounded-lg text-xs">
              Message
            </TabsTrigger>
            <TabsTrigger value="link" className="flex-1 rounded-lg text-xs">
              Link
            </TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-0 space-y-2">
            <Textarea
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submitText();
                }
              }}
              rows={2}
              disabled={disabled || sending}
              className="min-h-0 resize-none rounded-xl border-0 bg-background/80 shadow-inner"
            />
            <Button
              size="sm"
              className="w-full rounded-xl"
              disabled={disabled || sending || !text.trim()}
              onClick={() => void submitText()}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send message
            </Button>
          </TabsContent>
          <TabsContent value="link" className="mt-0 flex gap-2">
            <Input
              placeholder="https://"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submitLink()}
              disabled={disabled || sending}
              className="rounded-xl border-0 bg-background/80 shadow-inner"
            />
            <Button
              size="icon"
              className="shrink-0 rounded-xl"
              disabled={disabled || sending || !link.trim()}
              onClick={() => void submitLink()}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
