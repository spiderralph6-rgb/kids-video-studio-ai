import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kids Video Studio AI",
  description: "Turn one story idea into a complete children's animation production package."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
