import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "~/trpc/react";
import { Navbar } from "./_components/Navbar";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "A simple task management application",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="min-h-screen bg-background">
        <TRPCReactProvider>
          <SessionProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
