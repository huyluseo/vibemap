"use client";

import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

function NotificationWrapper({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    useNotifications(user);
    return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LanguageProvider>
                <NotificationWrapper>
                    {children}
                </NotificationWrapper>
            </LanguageProvider>
        </ThemeProvider>
    );
}
