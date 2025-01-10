import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import { AppSidebar } from "~/components/AppSidebar";
import { TaskInput } from "~/components/TaskInput";
import { SidebarProvider } from "~/components/ui/sidebar";
import { auth } from "~/server/auth";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "A simple task management application",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="min-h-screen bg-background">
        <TRPCReactProvider>
          <SessionProvider>
            {session ? (
              <SidebarProvider>
                <AppSidebar />
                <main className="min-h-screen w-full">
                  <div className="sticky top-0 z-50 border-b bg-background">
                    <div className="container mx-auto px-4 py-4">
                      <TaskInput />
                    </div>
                  </div>
                  <div className="container mx-auto px-4 py-8">{children}</div>
                </main>
              </SidebarProvider>
            ) : (
              <main className="min-h-screen w-full">
                <div className="container mx-auto px-4 py-8">{children}</div>
              </main>
            )}
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
