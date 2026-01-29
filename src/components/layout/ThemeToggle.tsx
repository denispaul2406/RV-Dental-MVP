"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";

interface ThemeToggleProps {
    className?: string;
    /** When true, show as icon-only (e.g. in collapsed sidebar) */
    iconOnly?: boolean;
    /** When true, hide label on small screens (e.g. for nav on laptops) */
    responsiveLabel?: boolean;
}

export default function ThemeToggle({ className, iconOnly, responsiveLabel }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const showLabel = !iconOnly;
    const labelVisibleClass = responsiveLabel ? "hidden sm:inline" : "";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className={clsx(
                "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200",
                "text-muted-foreground hover:bg-accent/5 hover:text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                iconOnly && "justify-center",
                !iconOnly && !className?.includes("w-auto") && "w-full",
                className
            )}
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            )}
            {showLabel && (
                <span className={clsx("font-medium whitespace-nowrap text-sm sm:text-base", labelVisibleClass)}>
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                </span>
            )}
        </button>
    );
}
