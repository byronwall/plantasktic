import { type Prisma } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ workspaceId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const whereClause: Prisma.ProjectWhereInput = {
        userId: ctx.session.user.id,
      };

      if (input?.workspaceId) {
        whereClause.workspaceId = input.workspaceId;
      }

      return await ctx.db.project.findMany({
        where: whereClause,
        orderBy: {
          name: "asc",
        },
        include: {
          workspace: true,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.delete({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().optional(),
        description: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dataToUpdate: Partial<import("@prisma/client").Project> = {};
      if (input.name) {
        dataToUpdate.name = input.name;
      }
      if (input.description !== undefined) {
        dataToUpdate.description = input.description;
      }

      if (Object.keys(dataToUpdate).length === 0) {
        return await ctx.db.project.findUnique({
          where: { id: input.projectId, userId: ctx.session.user.id },
        });
      }

      return await ctx.db.project.update({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
        data: dataToUpdate,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        workspaceId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          userId: ctx.session.user.id,
          workspaceId: input.workspaceId,
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
      });
    }),

  batchUpdateWorkspace: protectedProcedure
    .input(
      z.object({
        projectIds: z.array(z.string()),
        workspaceId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.workspaceId) {
        const workspaceExists = await ctx.db.workspace.findFirst({
          where: {
            id: input.workspaceId,
            userId: ctx.session.user.id,
          },
        });
        if (!workspaceExists) {
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
