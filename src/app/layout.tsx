import type { Metadata } from "next";
import { ThemeProvider } from "../components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Investment Research Agent",
  description: "An AI agent that researches companies and provides investment decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
