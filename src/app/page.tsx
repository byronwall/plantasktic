import Image from "next/image";
import Link from "next/link";

import { DueTaskList } from "~/app/_components/DueTaskList";
import { CreateWorkspaceButton } from "~/components/CreateWorkspaceButton";
import { Button } from "~/components/ui/button";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

import type { Workspace } from "@prisma/client";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return <LandingPage />;
  }

  const workspaces = await api.workspace.getAll();

  return (
    <HydrateClient>
      <div className="mx-auto flex flex-col gap-4 p-4">
        <div>
          <h2 className="mb-4 text-2xl font-bold">Workspaces</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {workspaces.map((workspace: Workspace) => (
              <Link key={workspace.id} href={`/${workspace.name}`}>
                <Button
                  variant="outline"
                  className="w-full justify-start p-6 text-lg"
                >
                  <div>
                    <h3 className="text-xl font-semibold">{workspace.name}</h3>
                  </div>
                </Button>
              </Link>
            ))}
            <CreateWorkspaceButton />
          </div>
        </div>
        <DueTaskList />
      </div>
    </HydrateClient>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 bg-gradient-to-b from-background to-muted/20 px-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <Image
            src="/android-chrome-192x192.png"
            alt="Plan Task Tic Logo"
            width={64}
            height={64}
            className="h-16 w-16"
          />
          <h1 className="text-4xl font-bold tracking-tight">Plan·Task·Tic</h1>
        </div>
        <div className="max-w-3xl space-y-6">
          <h2 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Modern Task Management{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            A powerful, intuitive task management system built for personal
            productivity. Organize, prioritize, and accomplish more with our
            smart features.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/api/auth/signin">Get Started Free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
        <div className="relative mt-8 w-full max-w-5xl">
          <div className="aspect-[16/9] rounded-xl border bg-card shadow-2xl">
            <Image
              src="/landing/dashboard.png"
              alt="Task Manager Dashboard Preview"
              fill
              className="rounded-xl object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div id="features" className="mx-auto max-w-7xl px-4 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Powerful Features for Modern Productivity
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 aspect-square w-16 rounded-lg bg-primary/10 p-3">
              <Image
                src="/landing/hierarchy.png"
                alt="Hierarchical Organization Icon"
                width={40}
                height={40}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Smart Organization</h3>
            <p className="text-muted-foreground">
              Organize tasks hierarchically with powerful parent-child
              relationships and multiple view options including list, kanban,
              and matrix views.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 aspect-square w-16 rounded-lg bg-primary/10 p-3">
              <Image
                src="/landing/timeblock.png"
                alt="Time Block Icon"
                width={40}
                height={40}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Time Block Planning</h3>
            <p className="text-muted-foreground">
              Schedule your tasks with intuitive time blocking, smart deadline
              tracking, and seamless calendar integration.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 aspect-square w-16 rounded-lg bg-primary/10 p-3">
              <Image
                src="/landing/workspace.png"
                alt="Workspace Organization Icon"
                width={40}
                height={40}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Flexible Workspaces</h3>
            <p className="text-muted-foreground">
              Create dedicated workspaces for different projects or areas of
              focus, with customizable settings and smart organization.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 aspect-square w-16 rounded-lg bg-primary/10 p-3">
              <Image
                src="/landing/command.png"
                alt="Command Palette Icon"
                width={40}
                height={40}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Lightning Fast Control
            </h3>
            <p className="text-muted-foreground">
              Access everything instantly with our command palette and keyboard
              shortcuts. Work faster and smarter.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 aspect-square w-16 rounded-lg bg-primary/10 p-3">
              <Image
                src="/landing/ui.png"
                alt="Modern UI Icon"
                width={40}
                height={40}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Modern Experience</h3>
            <p className="text-muted-foreground">
              Enjoy a beautiful, responsive interface with smooth animations
              that works seamlessly across all your devices.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 aspect-square w-16 rounded-lg bg-primary/10 p-3">
              <Image
                src="/landing/analytics.png"
                alt="Analytics Icon"
                width={40}
                height={40}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Smart Insights</h3>
            <p className="text-muted-foreground">
              Track your progress with powerful analytics, custom dashboards,
              and detailed activity history.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/30 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Start to manage your tasks today.
          </p>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/api/auth/signin">Start Managing Tasks</Link>
          </Button>
        </div>
      </div>

      {/* Footer with Creator Attribution */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/favicon.ico"
                alt="Plan Task Tic Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="text-sm text-muted-foreground">
                Plan·Task·Tic
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Created by{" "}
              <Link
                href="https://byroni.us"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Byron Wall
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
