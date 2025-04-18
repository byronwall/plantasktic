import {
  type DefaultSession,
  type NextAuthConfig,
  type User as NextUser,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { v4 as uuidv4 } from "uuid";

import { db } from "~/server/db";

/* AUTH stuff stymied by Prisma running in Middleware.  Using JWT strategy.
Guide here: https://github.com/nextauthjs/next-auth/issues/9122#issuecomment-1922631022
*/

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession["user"];
  }
}

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      roles: string[];
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    // ...other properties
    // role: UserRole;
    roles: string[];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  basePath: "/api/identity",
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          gh_username: profile.login,
          email: profile.email,
          image: profile.avatar_url,
          roles: [],
        };
      },
    }),
    CredentialsProvider({
      id: "demo-account",
      name: "One-Click Demo",
      credentials: {},
      async authorize() {
        // Generate a random demo user
        const userId: string = uuidv4();
        const shortId = userId.substring(0, 4);
        const demoUser: NextUser = {
          id: userId,
          name: `Demo User ${shortId}`,
          email: `demo-${userId}@example.com`,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          roles: [],
        };

        // Create the user in the database
        await db.user.create({
          data: demoUser,
        });

        // Create demo content for the new user
        const { createCaller } = await import("~/server/api/root");
        const caller = createCaller({
          session: {
            user: {
              ...demoUser,
              id: demoUser.id!, // We know this exists since we just created it
              roles: [],
            },
            expires: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 30 days from now
          },
          db,
          headers: new Headers({
            "x-trpc-source": "auth-config",
          }),
        });
        await caller.demo.seedDemoData();

        return demoUser;
      },
    }),
  ],

  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.user = user;
      }
      if (trigger === "update") {
        token.user.roles = session.user.roles;
      }
      return token;
    },
    session(sessionArgs) {
      // token only exists when the strategy is jwt and not database, so sessionArgs here will be { session, token }
      // with a database strategy it would be { session, user }
      if ("token" in sessionArgs) {
        const session = sessionArgs.session;
        if ("user" in sessionArgs.token) {
          const tokenUser = sessionArgs.token.user as NextUser;
          if (tokenUser.id) {
            session.user.id = tokenUser.id;
            session.user.roles = tokenUser.roles;
            return session;
          }
        }
      }
      return sessionArgs.session;
    },
  },
} satisfies NextAuthConfig;
