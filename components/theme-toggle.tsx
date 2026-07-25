"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="
        relative inline-flex h-9 w-9 items-center
        justify-center rounded-md border border-gray-200
        bg-white dark:border-zinc-800 dark:bg-zinc-800
        text-gray-800 dark:text-gray-200 hover:bg-zinc-100
        dark:hover:bg-zinc-950 transition-colors
      "
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  )
}
