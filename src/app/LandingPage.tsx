"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { ImageDialog } from "~/components/ui/image-dialog";

interface FeatureImage {
  src: string;
  alt: string;
  caption: string;
}

export function LandingPage() {
  const [selectedImage, setSelectedImage] = useState<FeatureImage | null>(null);

  const featureImages: FeatureImage[] = [
    {
      src: "/landing/hierarchy.png",
      alt: "Hierarchical Organization Icon",
      caption:
        "Organize tasks hierarchically with powerful parent-child relationships",
    },
    {
      src: "/landing/timeblock.png",
      alt: "Time Block Icon",
      caption: "Schedule your tasks with intuitive time blocking",
    },
    {
      src: "/landing/workspace.png",
      alt: "Workspace Organization Icon",
      caption: "Create dedicated workspaces for different projects",
    },
    {
      src: "/landing/command.png",
      alt: "Command Palette Icon",
      caption: "Access everything instantly with our command palette",
    },
    {
      src: "/landing/kanban.png",
      alt: "Kanban Board Icon",
      caption: "Visualize workflow with flexible Kanban boards",
    },
    {
      src: "/landing/matrix.png",
      alt: "Priority Matrix Icon",
      caption: "Prioritize tasks with a NxN matrix",
    },
  ];

  const handleImageClick = (image: FeatureImage) => {
    setSelectedImage(image);
  };

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
              <Link href="/api/identity/signin">Get Started Free</Link>
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
              src="/landing/timeblock.png"
              alt="Task Manager Time Block Preview"
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
          {featureImages.map((image, index) => (
            <div
              key={image.src}
              className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div
                className="relative mb-4 h-[300px] w-full cursor-pointer overflow-hidden rounded-lg bg-primary/10"
                onClick={() => handleImageClick(image)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {image.alt.replace(" Icon", "")}
              </h3>
              <p className="text-muted-foreground">{image.caption}</p>
            </div>
          ))}
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
            <Link href="/api/identity/signin">Start Managing Tasks</Link>
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

      {/* Image Dialog */}
      {selectedImage && (
        <ImageDialog
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          src={selectedImage.src}
          alt={selectedImage.alt}
          caption={selectedImage.caption}
        />
      )}
    </div>
  );
}
