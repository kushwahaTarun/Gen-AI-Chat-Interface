import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ConfigCatProvider } from "configcat-react";
import "./globals.css";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        {/* ConfigCatProvider wraps the application to provide feature flag context */}
        <ConfigCatProvider
          sdkKey={process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY || ""}
        >
          {children}
        </ConfigCatProvider>
      </body>
    </html>
  );
}
