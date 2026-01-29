"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "insightceph-theme";

type Theme = "light" | "dark";

type ThemeContextType = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    setTheme: () => {},
    toggleTheme: () => {},
});

function getStoredTheme(): Theme {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return "dark";
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === "light") {
        root.classList.add("light");
    } else {
        root.classList.remove("light");
    }
    localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = getStoredTheme();
        setThemeState(stored);
        applyTheme(stored);
        setMounted(true);
    }, []);

    const setTheme = (next: Theme) => {
        setThemeState(next);
        applyTheme(next);
    };

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
