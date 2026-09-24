import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

const zenMaru = Zen_Maru_Gothic({
  variable: "--font-zen-maru",
  weight: ["500", "700"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "大阪石材 AIチャットボット管理画面（試作）",
  description:
    "大阪石材のAIチャットボットと管理画面のUI/UX試作。フェーズ1（ダミーデータ版）。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${zenKaku.variable} ${zenMaru.variable} h-full`}>
      <body className="min-h-full bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
