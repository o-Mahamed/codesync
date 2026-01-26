import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeSync - Real-time Collaborative Code Editor",
  description: "Code together in real-time with multiple users",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}