import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "Job Search Co-Pilot",
  description: "Job search assistant skeleton",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
