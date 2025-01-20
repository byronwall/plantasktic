import { endOfWeek } from "date-fns";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const timeBlockRouter = createTRPCRouter({
  getWeeklyBlocks: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().nullish(),
        weekStart: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.workspaceId) {
        return [];
      }

      const weekEnd = endOfWeek(input.weekStart);

      return ctx.db.timeBlock.findMany({
        where: {
          workspaceId: input.workspaceId,
          startTime: {
            gte: input.weekStart,
            lte: weekEnd,
          },
        },
        include: {
          taskAssignments: {
            include: {
              task: true,
            },
          },
        },
      });
    }),

  getAssignedTasks: protectedProcedure
    .input(
      z.object({
        timeBlockId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const timeBlock = await ctx.db.timeBlock.findUnique({
        where: { id: input.timeBlockId },
        include: {
          taskAssignments: {
            include: {
              task: true,
            },
          },
        },
      });

      return (
        timeBlock?.taskAssignments.map((assignment) => assignment.task) ?? []
      );
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        title: z.string().optional(),
        startTime: z.date(),
        endTime: z.date(),
        dayOfWeek: z.number().min(0).max(6),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlock.create({
        data: {
          ...input,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        startTime: z.date(),
        endTime: z.date(),
        dayOfWeek: z.number().min(0).max(6),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.timeBlock.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlock.delete({
        where: { id: input.id },
      });
    }),

  assignTask: protectedProcedure
    .input(
      z.object({
        timeBlockId: z.string(),
        taskId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlockTask.create({
        data: {
          timeBlock: {
            connect: {
              id: input.timeBlockId,
            },
          },
          task: {
            connect: {
              task_id: input.taskId,
            },
          },
        },
      });
    }),

  unassignTask: protectedProcedure
    .input(
      z.object({
        timeBlockId: z.string(),
        taskId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlockTask.delete({
        where: {
          timeBlockId_taskId: {
            timeBlockId: input.timeBlockId,
            taskId: input.taskId,
          },
        },
      });
    }),
});
