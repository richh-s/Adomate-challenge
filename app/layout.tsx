import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Text Composer",
  description: "Canvas 2D text over image",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
