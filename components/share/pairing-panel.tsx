"use client";

import { CheckCircle2, Copy, KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isValidPairingCodeInput } from "@/lib/pairing-code";
import { cn } from "@/lib/utils";
import type { PairingPhase } from "@/types";

interface PairingPanelProps {
  phase: PairingPhase;
  code: string | null;
  error: string | null;
  onStartHost: () => void;
  onCancelHost: () => void;
  onVerify: (code: string) => void;
  onDismissSuccess: () => void;
  disabled?: boolean;
  className?: string;
}

export function PairingPanel({
  phase,
  code,
  error,
  onStartHost,
  onCancelHost,
  onVerify,
  onDismissSuccess,
  disabled,
  className,
}: PairingPanelProps) {
  const [input, setInput] = useState("");
  const digits = input.replace(/\D/g, "").slice(0, 3);

  useEffect(() => {
    setInput("");
  }, [phase]);

  const copyCode = () => {
    if (!code) return;
    void navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  if (phase === "success") {
    return (
      <Card className={cn("mx-5 mb-4 border-emerald-500/30 bg-emerald-500/5", className)}>
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              Connected successfully
            </p>
            <p className="text-sm text-muted-foreground">
              This device is trusted — you can share files without the code again.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onDismissSuccess}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3 px-5 pb-4", className)}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pair devices (first time)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Host */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Share / Connect</CardTitle>
            <CardDescription className="text-xs">
              Generate a code for the other device to enter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {phase === "hosting" && code ? (
              <>
                <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 py-6">
                  <span className="font-mono text-5xl font-bold tracking-[0.35em] text-primary tabular-nums">
                    {code}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Waiting for code entry…
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={copyCode}
                  >
                    <Copy className="mr-1.5 h-4 w-4" />
                    Copy code
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    onClick={onCancelHost}
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="w-full justify-center text-[10px]">
                  Expires in ~3 minutes · one-time use
                </Badge>
              </>
            ) : (
              <Button
                className="w-full rounded-xl"
                disabled={disabled}
                onClick={onStartHost}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Get pairing code
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Receiver */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Join with code</CardTitle>
            <CardDescription className="text-xs">
              Enter the 3-digit code from the other device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              placeholder="•••"
              value={digits}
              disabled={disabled || phase === "verifying"}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
              className="h-14 rounded-xl border-0 bg-muted/50 text-center font-mono text-3xl tracking-[0.5em] shadow-inner"
              aria-label="3-digit pairing code"
            />
            {error && phase === "error" && (
              <p className="text-center text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button
              className="w-full rounded-xl"
              disabled={disabled || !isValidPairingCodeInput(digits) || phase === "verifying"}
              onClick={() => onVerify(digits)}
            >
              {phase === "verifying" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
