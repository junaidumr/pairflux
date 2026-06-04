"use client";

import { ClipboardPaste, Link2, Send } from "lucide-react";
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
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="text">Text</TabsTrigger>
        <TabsTrigger value="link">Link</TabsTrigger>
      </TabsList>
      <TabsContent value="text" className="space-y-2">
        <Textarea
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          disabled={disabled}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={disabled || !text.trim()}
            onClick={() => {
              onSendText(text.trim());
              setText("");
            }}
          >
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={async () => {
              try {
                const clip = await navigator.clipboard.readText();
                setText(clip);
              } catch {
                /* denied */
              }
            }}
          >
            <ClipboardPaste className="mr-2 h-4 w-4" />
            Paste
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="link" className="space-y-2">
        <Input
          placeholder="https://…"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          disabled={disabled}
        />
        <Button
          size="sm"
          disabled={disabled || !link.trim()}
          onClick={() => {
            onSendLink(link.trim());
            setLink("");
          }}
        >
          <Link2 className="mr-2 h-4 w-4" />
          Send Link
        </Button>
      </TabsContent>
    </Tabs>
  );
}
