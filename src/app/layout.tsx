import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import { AppSidebar } from "~/components/AppSidebar";
import { CommandMenu } from "~/components/CommandMenu";
import { TaskInput } from "~/components/TaskInput";
import { TopNavSelectors } from "~/components/TopNavSelectors";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { WorkspaceProjectProvider } from "~/hooks/useWorkspaceProject";
import { auth } from "~/server/auth";
import { TRPCReactProvider } from "~/trpc/react";

import { GlobalModals } from "./_components/GlobalModals";

export const metadata: Metadata = {
  title: "Plan•Task•Tic",
  description: "Your intelligent task planning and management solution",
  icons: [{ rel: "icon", url: "/favicon-32x32.png" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={GeistSans.variable}>
      <head>
        <script
          defer
          src="https://as8ws0w.apps.byroni.us/script.js"
          data-website-id="43c38633-4fdf-4c81-aff6-3b993a3d7f3e"
        ></script>
      </head>
      <body className="min-h-screen bg-background">
        <TRPCReactProvider>
          <SessionProvider>
            {session ? (
              <WorkspaceProjectProvider>
                <SidebarProvider className="max-w-[100vw]">
                  <AppSidebar />
                  <main className="relative min-h-screen min-w-0 flex-1 p-1">
                    <div className="sticky top-0 z-50 border-b bg-background bg-white p-1">
                      <div className="flex items-center gap-2">
                        <SidebarTrigger />
                        <div className="flex w-[360px] gap-2">
                          <TopNavSelectors />
                        </div>

                        <TaskInput />
                      </div>
                    </div>
                    <div className="mx-auto p-2">{children}</div>
                    <GlobalModals />
                    <CommandMenu />
                  </main>
                </SidebarProvider>
              </WorkspaceProjectProvider>
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
