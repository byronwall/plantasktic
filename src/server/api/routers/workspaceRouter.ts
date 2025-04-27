import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const workspaceRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.workspace.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string(), description: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.workspace.create({
        data: {
          name: input.name,
          description: input.description,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().optional(),
        description: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dataToUpdate: Partial<import("@prisma/client").Workspace> = {};
      if (input.name) {
        dataToUpdate.name = input.name;
      }
      if (input.description !== undefined) {
        dataToUpdate.description = input.description;
      }

      if (Object.keys(dataToUpdate).length === 0) {
        return await ctx.db.workspace.findUnique({
          where: { id: input.workspaceId, userId: ctx.session.user.id },
        });
      }

      return await ctx.db.workspace.update({
        where: {
          id: input.workspaceId,
          userId: ctx.session.user.id,
        },
        data: dataToUpdate,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Database schema handles cascading deletes for related Projects, Goals, TimeBlocks, etc.
      return await ctx.db.workspace.delete({
        where: {
          id: input.workspaceId,
          userId: ctx.session.user.id,
        },
      });
    }),

  assignProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        workspaceId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.update({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
        data: {
          workspaceId: input.workspaceId,
        },
      });
    }),

  stats: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectCount = await ctx.db.project.count({
        where: {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        },
      });
      return {
        projectCount,
      };
    }),

  batchAssignProjects: protectedProcedure
    .input(
      z.object({
        projectIds: z.array(z.string()),
        workspaceId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.workspaceId) {
        const targetWorkspace = await ctx.db.workspace.findUnique({
          where: {
            id: input.workspaceId,
            userId: ctx.session.user.id,
          },
        });
        if (!targetWorkspace) {
          throw new Error("Target workspace not found or access denied.");
        }
      }

      const result = await ctx.db.project.updateMany({
        where: {
          id: {
            in: input.projectIds,
          },
          userId: ctx.session.user.id,
        },
        data: {
          workspaceId: input.workspaceId,
        },
      });

      return { count: result.count };
    }),
});
