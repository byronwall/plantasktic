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
});
