import "./globals.css";
import type { Metadata } from "next";
import NoDocScroll from "../features/editor/components/NoDocScroll";

export const metadata: Metadata = {
  title: "Image Text Composer",
  description: "Canvas 2D text over image",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NoDocScroll />
        {/* Fixed viewport wrapper = no dependency on html/body overflow */}
        <div id="app-root" className="fixed inset-0 flex min-w-0 bg-[#1F2937]">
          {/* children fills this viewport */}
          <div className="flex flex-col w-full flex-1 min-h-0 text-white">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
