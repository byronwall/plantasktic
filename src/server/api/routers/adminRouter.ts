import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env.mjs";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const isAdmin = async (ctx: { auth: { userId: string } }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.auth.userId },
    select: { roles: true },
  });

  if (!user?.roles.includes("SITE_ADMIN")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be an admin to access this resource",
    });
  }
};

export const adminRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    await isAdmin(ctx);

    return ctx.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        lastActivity: true,
        _count: {
          select: {
            projects: true,
            Task: true,
            goals: true,
          },
        },
      },
      orderBy: {
        lastActivity: "desc",
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

      await ctx.prisma.user.update({
        where: { id: ctx.auth.userId },
        data: {
          roles: ["SITE_ADMIN"],
        },
      });

      return { success: true };
    }),
});
