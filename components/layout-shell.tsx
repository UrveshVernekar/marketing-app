"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth-provider";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, token } = useAuth();
  
  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (token && !isAuthPage) {
      document.documentElement.classList.add("overflow-hidden", "h-full");
      document.body.classList.add("overflow-hidden", "h-full");
    } else {
      document.documentElement.classList.remove("overflow-hidden", "h-full");
      document.body.classList.remove("overflow-hidden", "h-full");
    }
    return () => {
      document.documentElement.classList.remove("overflow-hidden", "h-full");
      document.body.classList.remove("overflow-hidden", "h-full");
    };
  }, [token, isAuthPage]);

  // While checking auth on initial mount, show a nice loading spinner
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50 dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  // If we are not logged in and not on a public page, don't show the dashboard shell layout.
  // The AuthProvider will handle the redirect.
  if (!token && !isAuthPage) {
    return null;
  }

  if (isAuthPage) {
    return (
      <div className="w-full min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a]">
        <TooltipProvider>{children}</TooltipProvider>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar />
        <main className="flex-[1] overflow-y-auto">
          <TooltipProvider>{children}</TooltipProvider>
        </main>
      </div>
    </>
  );
}
