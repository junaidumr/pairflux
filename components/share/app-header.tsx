"use client";

import { Moon, Sun, Zap } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrPairing } from "@/components/share/qr-pairing";
import type { PairingPayload } from "@/types";

interface AppHeaderProps {
  deviceName: string;
  roomId: string;
  deviceId: string;
  ready: boolean;
  onRename: (name: string) => void;
  onPair: (payload: PairingPayload) => void;
}

export function AppHeader({
  deviceName,
  roomId,
  deviceId,
  ready,
  onRename,
  onPair,
}: AppHeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </span>
          peer-beam
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant="outline" className="font-mono text-xs">
            room:{roomId}
          </Badge>
          <Badge variant={ready ? "default" : "secondary"}>
            {ready ? "Live" : "Connecting…"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="hidden h-8 w-36 md:block"
            defaultValue={deviceName}
            onBlur={(e) => onRename(e.target.value)}
            aria-label="Device name"
          />
          <QrPairing roomId={roomId} deviceId={deviceId} onPair={onPair} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {resolvedTheme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
