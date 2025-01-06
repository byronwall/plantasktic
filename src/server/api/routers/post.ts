import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  createTask: protectedProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.task.create({
        data: {
          title: input.text,
          status: "Open",
          userId: ctx.session.user.id,
        },
      });

      return "Task created!";
    }),

  getTasks: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    return await ctx.db.task.findMany({
      where: {
        userId,
      },
    });
  }),
});
