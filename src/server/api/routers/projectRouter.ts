import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userId: ctx.session.user.id,
      },
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

  rename: protectedProcedure
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
});
