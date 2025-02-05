import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const adminRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.includes("SITE_ADMIN")) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be an admin to access this resource",
      });
    }

    return ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        _count: {
          select: {
            projects: true,
            Task: true,
            goals: true,
          },
        },
      },
    });
  }),

  verifyAdminAccess: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.password !== env.ADMIN_SECRET) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid admin password",
        });
      }

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          roles: ["SITE_ADMIN"],
        },
      });

      return { success: true };
    }),
});
