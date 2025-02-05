import { projectRouter } from "~/server/api/routers/projectRouter";
import { taskRouter } from "~/server/api/routers/taskRouter";
import { timeBlockRouter } from "~/server/api/routers/timeBlockRouter";
import { workspaceRouter } from "~/server/api/routers/workspaceRouter";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { adminRouter } from "./routers/adminRouter";
import { demoRouter } from "./routers/demoRouter";
import { goalRouter } from "./routers/goalRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  task: taskRouter,
  project: projectRouter,
  workspace: workspaceRouter,
  goal: goalRouter,
  timeBlock: timeBlockRouter,
  demo: demoRouter,
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
