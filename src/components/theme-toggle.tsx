"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:hover:bg-zinc-800 transition-all shadow-sm backdrop-blur-xl flex items-center justify-center shrink-0"
            aria-label="Toggles theme"
        >
            {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-500" />
            ) : (
                <Moon className="w-5 h-5 text-indigo-500" />
            )}
        </button>
    );
}
