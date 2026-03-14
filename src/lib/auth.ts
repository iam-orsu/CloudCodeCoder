import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, profile }) {
      try {
        // Upsert user in database
        const githubId = String(profile?.id || user.id);
        await prisma.user.upsert({
          where: { githubId },
          update: {
            name: user.name || "",
            email: user.email || "",
          },
          create: {
            email: user.email || "",
            name: user.name || "",
            githubId,
          },
        });
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return true;
      }
    },
    async jwt({ token, profile }) {
      if (profile?.id) {
        token.githubId = String(profile.id);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.githubId = token.githubId;

        // Fetch internal user ID
        const dbUser = await prisma.user.findUnique({
          where: { githubId: token.githubId },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
  },
};
