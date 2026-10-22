"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type UserRole = "admin" | "staff" | "customer";

export type UserProfile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  business_name: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SignUpData = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  businessName?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null; requiresVerification?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatAuthError(message: string) {
  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return "Could not reach Supabase Auth. Check that Vercel has the correct Supabase project URL and public key, and that the project is active.";
  }
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, full_name, phone, business_name, city, state, pincode")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Unable to fetch user profile:", error.message);
        return null;
      }

      if (data) {
        const userProfile: UserProfile = {
          id: data.id,
          role: (data.role as UserRole) || "customer",
          full_name: data.full_name,
          phone: data.phone,
          business_name: data.business_name,
          city: data.city,
          state: data.state,
          pincode: data.pincode
        };
        setProfile(userProfile);
        return userProfile;
      }
    } catch (err) {
      console.warn("Profile fetch error:", err);
    }
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // 1. Initial session load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === "SIGNED_OUT" || !currentSession?.user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
          await fetchProfile(currentSession.user.id);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { error: formatAuthError(error.message) };
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "An unexpected error occurred." };
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      const supabase = getSupabaseBrowser();
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          emailRedirectTo: typeof window !== "undefined"
            ? `${window.location.origin}/auth/confirm?next=/account`
            : undefined,
          data: {
            full_name: data.fullName.trim(),
            phone: data.phone.trim(),
            business_name: data.businessName?.trim() || "",
            city: data.city?.trim() || "",
            state: data.state?.trim() || "",
            pincode: data.pincode?.trim() || ""
          }
        }
      });

      if (error) {
        return { error: formatAuthError(error.message) };
      }

      const requiresVerification = Boolean(
        authData.user && !authData.session && authData.user.identities?.length
      );

      return { error: null, requiresVerification };
    } catch (err) {
      if (err instanceof TypeError && /fetch/i.test(err.message)) {
        return {
          error:
            "We couldn't reach the account service. Check your internet connection and try again. If this continues, the site's administrator should verify the deployed Supabase URL and public API key."
        };
      }
      return { error: err instanceof Error ? err.message : "Unable to register the account. Please try again." };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("SignOut error:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, []);

  // Determine user role (prefer profile role, fallback to app_metadata)
  const role: UserRole | null = useMemo(() => {
    if (profile?.role) return profile.role;
    const jwtRole = user?.app_metadata?.role as UserRole | undefined;
    return jwtRole || (user ? "customer" : null);
  }, [profile?.role, user]);

  const isAdmin = role === "admin";
  const isStaff = role === "admin" || role === "staff";

  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    role,
    loading,
    isAdmin,
    isStaff,
    signIn,
    signUp,
    signOut,
    refreshProfile
  }), [user, session, profile, role, loading, isAdmin, isStaff, signIn, signUp, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
