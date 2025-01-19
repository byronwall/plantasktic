import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const goalRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().optional(),
        projectId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.goal.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.workspaceId && { workspaceId: input.workspaceId }),
          ...(input.projectId && { projectId: input.projectId }),
        },
        include: {
          progress: true,
          comments: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        priority: z.string().optional(),
        startDate: z.date().optional(),
        dueDate: z.date().optional(),
        targetValue: z.number().optional(),
        metricUnit: z.string().optional(),
        projectId: z.string().optional(),
        workspaceId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          status: "active",
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        priority: z.string().optional(),
        status: z.string().optional(),
        startDate: z.date().optional(),
        dueDate: z.date().optional(),
        targetValue: z.number().optional(),
        currentValue: z.number().optional(),
        metricUnit: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.goal.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.delete({
        where: { id: input.id },
      });
    }),

  addProgress: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        value: z.number(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goalProgress.create({
        data: input,
      });
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goalComment.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),
});
