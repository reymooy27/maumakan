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
  try {
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
  } catch (error) {
    // Supabase client creation can fail if NEXT_PUBLIC_SUPABASE_URL is missing
    // or if cookies() is called in an environment where it's not available.
    console.warn("getUserId: Supabase auth check skipped:", error instanceof Error ? error.message : error);
  }

  return null;
}

/**
 * Manually sync a user from Supabase to Prisma by their ID.
 * Useful when we have an ID from a relation (like Review) but the user 
 * hasn't been synced to the Prisma User table yet.
 */
export async function syncUserById(id: string) {
  try {
    // Check if already in Prisma
    const existing = await prisma.user.findUnique({ where: { id } });
    if (existing) return existing;

    // Not in Prisma, try to get from Supabase Admin (if possible) or just 
    // the current session if it matches. For a generic sync of *any* user ID,
    // we'd normally need Supabase Admin API. 

    // As a fallback, if we can't get full details, we create a stub 
    // to satisfy foreign key constraints and allow profile viewing.
    // In a real app, you'd use supabase.auth.admin.getUserById(id).

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && user.id === id) {
      return await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          image: user.user_metadata?.avatar_url,
        }
      });
    }

    // If it's not the current user, we can't easily get their email/name 
    // without Admin API. But they SHOULD have been synced when they 
    // performed the action (like posting a review).

    return null;
  } catch (error) {
    console.error("syncUserById failed:", error);
    return null;
  }
}
