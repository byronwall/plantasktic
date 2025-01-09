import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

/* AUTH stuff stymied by Prisma running in Middleware.  Using JWT strategy.
Guide here: https://github.com/nextauthjs/next-auth/issues/9122#issuecomment-1922631022
*/

import { type User as NextUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
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
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
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
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) token.user = user;
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
            return session;
          }
        }
      }
      return sessionArgs.session;
    },
  },
} satisfies NextAuthConfig;
