"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "@/locales/en";
import { vi } from "@/locales/vi";

type Language = "en" | "vi";
type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Default to 'vi' if no saved preference
    const [language, setLanguageState] = useState<Language>("vi");

    useEffect(() => {
        const savedLang = localStorage.getItem("language");
        if (savedLang === "en" || savedLang === "vi") {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);
    };

    const t = (path: string): string => {
        const keys = path.split('.');
        let current: any = language === "en" ? en : vi;

        for (const key of keys) {
            if (current[key] === undefined) return path;
            current = current[key];
        }

        return typeof current === 'string' ? current : path;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
