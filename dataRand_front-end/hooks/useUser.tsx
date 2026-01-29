"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { supabase, type Profile } from "@/lib/supabase"

export function useUser() {
  const { user: privyUser, authenticated, ready } = usePrivy()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!ready) {
      setIsLoading(true)
      return
    }

    if (!authenticated || !privyUser?.id) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    fetchOrCreateProfile(privyUser.id)
  }, [ready, authenticated, privyUser?.id])

  const fetchOrCreateProfile = async (userId: string) => {
    try {
      console.log("Signed up user data from Privy:", privyUser);

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", userId)
        .maybeSingle();

      if (existingProfile) {
        setProfile(existingProfile as Profile);
      } else {
        // The user does not want to create a profile in the database.
        // We will create a temporary, client-side-only profile to allow the UI to render.
        // Note: Functionality that requires a database profile (e.g., accepting tasks) will not work.
        const emailAddress = privyUser?.email?.address || null;
        const fullName = privyUser?.google?.name || privyUser?.twitter?.name || privyUser?.github?.name || emailAddress?.split("@")[0] || null;

        const tempProfile: Profile = {
          id: 'temp-id-' + userId, // Temporary ID
          auth_id: userId,
          email: emailAddress,
          full_name: fullName,
          role: "worker",
          avatar_url: null,
          reputation_score: 0,
          total_earnings: 0,
          tasks_completed: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(tempProfile);
      }
    } catch (error) {
      console.error("Profile error:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!privyUser || !profile) return { error: new Error("Not authenticated") }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("auth_id", privyUser.id)

    if (!error) {
      setProfile({ ...profile, ...updates })
    }

    return { error }
  }

  return {
    currentUser: profile,
    privyUser,
    isLoading,
    updateProfile,
    authenticated,
    ready
  }
}
