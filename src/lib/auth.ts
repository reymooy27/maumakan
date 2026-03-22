import { AuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    CredentialsProvider({
      name: "Guest Login",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "guest" },
        password: { label: "Password", type: "password" }
      },
      async authorize() {
        // Auto-login as a mock guest user for testing without having real OAuth keys
        let user = await prisma.user.findUnique({
          where: { email: "guest@example.com" }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: "Guest User",
              email: "guest@example.com",
              image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
            }
          });
        }
        return user;
      }
    })
  ],
  session: {
    strategy: "jwt", // Use JWT to support credentials provider without database sessions
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "maumakan-local-secret-32-chars-long",
};
