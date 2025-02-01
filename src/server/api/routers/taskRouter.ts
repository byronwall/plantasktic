import { type Prisma } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Define the schema for task updates
const taskUpdateSchema = z.object({
  title: z.string().optional(),
  status: z
    .enum(["open", "completed", "pending", "waiting", "blocked", "cancelled"])
    .optional(),
  category: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  due_date: z.date().nullable().optional(),
  start_date: z.date().nullable().optional(),
  priority: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  projectId: z.string().nullable().optional(),
});

export const taskRouter = createTRPCRouter({
  // Project-related endpoints
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        workspaceId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          userId: ctx.session.user.id,
          workspaceId: input.workspaceId,
        },
      });
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        workspace: true,
      },
    });
  }),

  deleteProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First delete all tasks in the project
      await ctx.db.task.deleteMany({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
      });

      // Then delete the project
      return await ctx.db.project.delete({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
      });
    }),

  renameProject: protectedProcedure
    .input(z.object({ projectId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.update({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),

  createTask: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        status: z.string(),
        projectId: z.string().nullable(),
        parentTaskId: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.task.create({
        data: {
          title: input.title,
          status: input.status,
          userId: ctx.session.user.id,
          projectId: input.projectId,
          parentTaskId: input.parentTaskId,
        },
      });

      return "Task created!";
    }),

  getTasks: protectedProcedure
    .input(
      z.object({
        showCompleted: z.boolean(),
        projectId: z.string().optional(),
        workspaceId: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const whereClause: Prisma.TaskWhereInput = {
        userId,
        ...(input.showCompleted ? {} : { status: { not: "completed" } }),
      };

      if (input.projectId) {
        whereClause.projectId = input.projectId;
      } else if (input.workspaceId) {
        whereClause.project = {
          workspaceId: input.workspaceId,
        };
      }

      return await ctx.db.task.findMany({
        where: whereClause,
        orderBy: {
          updated_at: "desc",
        },
      });
    }),

  updateTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        data: taskUpdateSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.update({
        where: {
          task_id: input.taskId,
          userId: ctx.session.user.id,
        },
        data: input.data,
      });
    }),

  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    return tasks.map((t) => t.category!);
  }),

  bulkCreateTasks: protectedProcedure
    .input(
      z.object({
        tasks: z.array(
          z.object({
            title: z.string(),
            status: z.string(),
          }),
        ),
        projectId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.db.task.createMany({
        data: input.tasks.map((task) => ({
          title: task.title,
          status: task.status,
          userId,
          projectId: input.projectId,
        })),
      });

      return "Tasks created!";
    }),

  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.delete({
        where: { task_id: input.taskId },
      });
    }),

  bulkDeleteTasks: protectedProcedure
    .input(z.object({ taskIds: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.task.deleteMany({
        where: {
          task_id: { in: input.taskIds },
          userId: ctx.session.user.id,
        },
      });
      return "Tasks deleted!";
    }),

  bulkUpdateTaskCategory: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.number()),
        category: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.task.updateMany({
        where: {
          task_id: { in: input.taskIds },
          userId: ctx.session.user.id,
        },
        data: {
          category: input.category,
        },
      });
      return "Categories updated!";
    }),

  bulkMoveTasksToProject: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.number()),
        projectId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.task.updateMany({
        where: {
          task_id: { in: input.taskIds },
          userId: ctx.session.user.id,
        },
        data: {
          projectId: input.projectId,
        },
      });
      return "Tasks moved!";
    }),

  moveTaskToProject: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        projectId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.update({
        where: {
          task_id: input.taskId,
          userId: ctx.session.user.id,
        },
        data: {
          projectId: input.projectId,
        },
      });
    }),

  duplicateTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // First get the existing task
      const existingTask = await ctx.db.task.findFirst({
        where: {
          task_id: input.taskId,
          userId: ctx.session.user.id,
        },
      });

      if (!existingTask) {
        throw new Error("Task not found");
      }

      // Create a new task with the same data
      // set the task_id to undefined to avoid conflict
      return await ctx.db.task.create({
        data: {
          ...existingTask,
          title: `Copy: ${existingTask.title}`,
          task_id: undefined,
        },
      });
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        workspaceId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: {
          project: {
            workspaceId: input.workspaceId,
          },
          title: {
            contains: input.query,
            mode: "insensitive",
          },
          status: { not: "completed" },
        },
        orderBy: {
          updated_at: "desc",
        },
        take: 10,
      });
    }),

  // New endpoints for command menu
  searchTasks: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        workspaceId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause: Prisma.TaskWhereInput = {
        userId: ctx.session.user.id,
        title: {
          contains: input.query,
          mode: "insensitive",
        },
      };

      if (input.workspaceId) {
        whereClause.project = {
          workspaceId: input.workspaceId,
        };
      }

      return ctx.db.task.findMany({
        where: whereClause,
        orderBy: {
          updated_at: "desc",
        },
        include: {
          project: true,
        },
        take: 10,
      });
    }),

  getRelatedTasks: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { task_id: input.taskId },
        include: {
          subTasks: true,
          parentTask: true,
        },
      });

      return {
        subTasks: task?.subTasks ?? [],
        parentTask: task?.parentTask ?? null,
      };
    }),
});
