import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { LayoutShell } from "@/components/layout-shell";

export const metadata: Metadata = {
  title: "IFB Materials App",
  description: "Materials App using Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} antialiased`}
    >
      <body className="min-h-full flex font-sans bg-gray-50/50 dark:bg-[#0a0a0a]">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LayoutShell>
              {children}
            </LayoutShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
