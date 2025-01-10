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

  rename: protectedProcedure
    .input(z.object({ workspaceId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.workspace.update({
        where: {
          id: input.workspaceId,
          userId: ctx.session.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First update all projects in the workspace to have no workspace
      await ctx.db.project.updateMany({
        where: {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        },
        data: {
          workspaceId: null,
        },
      });

      // Then delete the workspace
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
});
