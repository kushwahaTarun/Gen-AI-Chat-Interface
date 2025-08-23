import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";

import Providers from "../components/Providers";
import AppSidebar from "../components/AppSidebar";
import { Sidebar } from "../components/Sidebar"; // Import the Sidebar provider
import "./globals.css";
import { cn } from "@/lib/util";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Baangdu",
  description:
    "chat interface built with Next.js that provide AI-powered conversations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <Providers>
          <Sidebar>
            {" "}
            {/* Wrap everything with Sidebar provider */}
            <div
              className={cn(
                "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 max-w-full mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
                "h-screen"
              )}
            >
              {/* Sidebar component - now inside Sidebar provider */}
              <AppSidebar />

              {/* Main content area */}
              {children}
            </div>
          </Sidebar>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
