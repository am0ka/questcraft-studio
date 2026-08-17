import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuestCraft Studio | Visual Game Narrative & Dialogue IDE",
  description: "High-performance visual quest & branching dialogue graph IDE with live runtime simulation, deterministic state evaluation, and native Unity & Godot compilers.",
  keywords: [
    "Game Tooling",
    "Dialogue Tree Editor",
    "React Flow",
    "Unity CodeGen",
    "Godot 4",
    "FastAPI",
    "State Machine"
  ],
  authors: [{ name: "Amir Sarsen", url: "https://sarsen.dev" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
