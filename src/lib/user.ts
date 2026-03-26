import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Gets the current user's ID from either NextAuth or Supabase session.
 * If the user is from Supabase and not in the Prisma User table, it will sync it.
 */
export async function getUserId() {
  // Try NextAuth session first
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  // Try Supabase session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Find or create user in Prisma to sync with Supabase
    let prismaUser = await prisma.user.findUnique({
      where: { email: user.email || "" }
    });

    if (!prismaUser && user.email) {
      prismaUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          image: user.user_metadata?.avatar_url,
        }
      });
    }
    return prismaUser?.id || user.id; // Return Supabase ID even if sync failed
  }

  return null;
}
