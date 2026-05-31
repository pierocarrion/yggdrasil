import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yggdrasil - Semantic Journaling",
  description: "AI-powered semantic journaling web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
