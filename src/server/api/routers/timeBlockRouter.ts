import { addDays, endOfDay, startOfDay } from "date-fns";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const timeBlockRouter = createTRPCRouter({
  getWeeklyBlocks: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().nullish(),
        weekStart: z.date(),
        numberOfDays: z.number().min(1).max(31).default(7),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.workspaceId) {
        return [];
      }

      const weekEnd = addDays(input.weekStart, input.numberOfDays);

      return ctx.db.timeBlock.findMany({
        where: {
          workspaceId: input.workspaceId,
          startTime: {
            gte: input.weekStart,
            lt: weekEnd,
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
        color: z.string().optional(),
        isFixedTime: z.boolean().optional(),
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
        color: z.string().optional(),
        isFixedTime: z.boolean().optional(),
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
        weekEnd: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.timeBlockDayMetadata.findMany({
        where: {
          workspaceId: input.workspaceId,
          date: {
            gte: input.weekStart,
            lt: input.weekEnd,
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
        id: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlockDayMetadata.update({
        where: { id: input.id },
        data: {
          value: input.value,
        },
      });
    }),

  createTimeBlockDayMeta: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        date: z.date(),
        key: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlockDayMetadata.create({
        data: {
          ...input,
        },
      });
    }),

  deleteTimeBlockDayMeta: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.timeBlockDayMetadata.delete({
        where: { id: input.id },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.timeBlock.findUnique({
        where: { id: input.id },
      });
    }),

  duplicate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingBlock = await ctx.db.timeBlock.findUnique({
        where: { id: input.id },
        include: {
          taskAssignments: true,
        },
      });

      if (!existingBlock) {
        throw new Error("Time block not found");
      }

      const { id, startTime, endTime, ...rest } = existingBlock;

      return ctx.db.timeBlock.create({
        data: {
          ...rest,
          startTime: input.startTime,
          endTime: input.endTime,
          taskAssignments: {
            create: existingBlock.taskAssignments.map((assignment) => ({
              taskId: assignment.taskId,
            })),
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

  bulkUpdate: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          startTime: z.date(),
          endTime: z.date(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      // Use a transaction to ensure all updates succeed or none do
      return ctx.db.$transaction(
        input.map((update) =>
          ctx.db.timeBlock.update({
            where: { id: update.id },
            data: {
              startTime: update.startTime,
              endTime: update.endTime,
            },
          }),
        ),
      );
    }),

  getTimeBlockCounts: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const today = startOfDay(new Date());
      const nextWeek = endOfDay(addDays(today, 7));

      const todayEnd = endOfDay(today);

      const [todayBlocks, weekBlocks] = await Promise.all([
        ctx.db.timeBlock.count({
          where: {
            workspaceId: input.workspaceId,
            startTime: {
              gte: today,
              lte: todayEnd,
            },
          },
        }),
        ctx.db.timeBlock.count({
          where: {
            workspaceId: input.workspaceId,
            startTime: {
              gt: todayEnd,
              lte: nextWeek,
            },
          },
        }),
      ]);

      return {
        today: todayBlocks,
        upcoming: weekBlocks,
      };
    }),

  getWorkspaceTimeBlockCounts: protectedProcedure.query(async ({ ctx }) => {
    const today = startOfDay(new Date());
    const nextWeek = endOfDay(addDays(today, 7));
    const todayEnd = endOfDay(today);

    type WorkspaceWithTimeBlocks = {
      id: string;
      TimeBlock: {
        startTime: Date;
      }[];
    };

    const workspaces = (await ctx.db.workspace.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      select: {
        id: true,
        TimeBlock: {
          where: {
            OR: [
              {
                startTime: {
                  gte: today,
                  lte: todayEnd,
                },
              },
              {
                startTime: {
                  gt: todayEnd,
                  lte: nextWeek,
                },
              },
            ],
          },
          select: {
            startTime: true,
          },
        },
      },
    })) as WorkspaceWithTimeBlocks[];

    const counts: Record<string, { today: number; upcoming: number }> = {};

    for (const workspace of workspaces) {
      const todayBlocks = workspace.TimeBlock.filter((block) => {
        return block.startTime >= today && block.startTime <= todayEnd;
      }).length;

      const upcomingBlocks = workspace.TimeBlock.filter((block) => {
        return block.startTime > todayEnd && block.startTime <= nextWeek;
      }).length;

      counts[workspace.id] = {
        today: todayBlocks,
        upcoming: upcomingBlocks,
      };
    }

    return counts;
  }),
});
