import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "秘鲁中华三民联校志愿者管理",
  description: "秘鲁中华三民联校志愿者工作与生活管理平台",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${noto.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
