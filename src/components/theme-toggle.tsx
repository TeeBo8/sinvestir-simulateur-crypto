"use client";

import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Bascule light/dark (next-themes). Les icônes sont pilotées par CSS via la
 * classe `.dark` (posée avant le paint par next-themes) → aucun état JS, donc
 * aucun risque de mismatch d'hydratation.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      aria-label="Basculer le thème clair/sombre"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="hidden size-4 dark:block" />
      <MoonIcon className="size-4 dark:hidden" />
    </Button>
  );
}
