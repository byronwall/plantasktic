import { endOfDay, endOfWeek, startOfDay } from "date-fns";
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

  deleteByDateRange: protectedProcedure
    .input(
      z.object({
        startTime: z.date(),
        endTime: z.date(),
        workspaceId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlock.deleteMany({
        where: {
          workspaceId: input.workspaceId,
          startTime: {
            gte: input.startTime,
            lt: input.endTime,
          },
        },
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

  // Day metadata procedures
  getTimeBlockDayMeta: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        date: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const dayStart = startOfDay(input.date);
      const dayEnd = endOfDay(input.date);

      return ctx.db.timeBlockDayMetadata.findMany({
        where: {
          workspaceId: input.workspaceId,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });
    }),

  getWeekMetadata: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        weekStart: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const weekEnd = endOfWeek(input.weekStart);

      return ctx.db.timeBlockDayMetadata.findMany({
        where: {
          workspaceId: input.workspaceId,
          date: {
            gte: input.weekStart,
            lte: weekEnd,
          },
        },
      });
    }),

  getDateRangeMetadata: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.timeBlockDayMetadata.findMany({
        where: {
          workspaceId: input.workspaceId,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: {
          date: "asc",
        },
      });
    }),

  upsertTimeBlockDayMeta: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        date: z.date(),
        key: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlockDayMetadata.upsert({
        where: {
          workspaceId_date_key: {
            workspaceId: input.workspaceId,
            date: startOfDay(input.date),
            key: input.key,
          },
        },
        create: {
          ...input,
          date: startOfDay(input.date),
        },
        update: {
          value: input.value,
        },
      });
    }),

  deleteTimeBlockDayMeta: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        date: z.date(),
        key: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlockDayMetadata.delete({
        where: {
          workspaceId_date_key: {
            workspaceId: input.workspaceId,
            date: startOfDay(input.date),
            key: input.key,
          },
        },
      });
    }),
});
