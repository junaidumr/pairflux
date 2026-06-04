"use client";

import { ClipboardPaste, Link2, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface TextShareProps {
  onSendText: (text: string) => void;
  onSendLink: (url: string) => void;
  disabled?: boolean;
}

export function TextShare({ onSendText, onSendLink, disabled }: TextShareProps) {
  const [text, setText] = useState("");
  const [link, setLink] = useState("");

  return (
    <div className="border-t border-border/40 bg-muted/10 px-5 py-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        Quick send
      </p>
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
            placeholder="Type something…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            disabled={disabled}
            className="min-h-0 resize-none rounded-xl border-0 bg-background/80 shadow-inner"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 rounded-xl"
              disabled={disabled || !text.trim()}
              onClick={() => {
                onSendText(text.trim());
                setText("");
              }}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-xl"
              disabled={disabled}
              onClick={async () => {
                try {
                  setText(await navigator.clipboard.readText());
                } catch {
                  /* denied */
                }
              }}
            >
              <ClipboardPaste className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="link" className="mt-0 flex gap-2">
          <Input
            placeholder="https://"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={disabled}
            className="rounded-xl border-0 bg-background/80 shadow-inner"
          />
          <Button
            size="icon"
            className="shrink-0 rounded-xl"
            disabled={disabled || !link.trim()}
            onClick={() => {
              onSendLink(link.trim());
              setLink("");
            }}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
