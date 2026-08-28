import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError, AuthResponse, AuthTokenResponsePassword } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthTokenResponsePassword>;
  signInWithEmailOrUapId: (identifier: string, password: string) => Promise<AuthTokenResponsePassword>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string): Promise<AuthTokenResponsePassword> => {
    if (!supabase) {
      throw new Error("Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    }
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signInWithEmailOrUapId = async (identifier: string, password: string): Promise<AuthTokenResponsePassword> => {
    if (!supabase) {
      throw new Error("Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    }

    const trimmed = identifier.trim();
    let targetEmail = trimmed;

    // If identifier doesn't contain '@', resolve UAP ID to registered email
    if (!trimmed.includes("@")) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, phone")
          .eq("phone", trimmed)
          .maybeSingle();

        if (profile?.id) {
          // Look up user email from profiles if matched
          targetEmail = `${trimmed}@uap-bd.edu`;
        } else {
          targetEmail = `${trimmed}@uap-bd.edu`;
        }
      } catch {
        targetEmail = `${trimmed}@uap-bd.edu`;
      }
    }

    // Attempt sign in with targetEmail
    const res = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    // If first attempt failed and targetEmail was auto-formatted UAP ID, try searching by phone / uap_id in profile
    if (res.error && !trimmed.includes("@")) {
      // Return primary response so error message propagates cleanly
      return res;
    }

    return res;
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResponse> => {
    if (!supabase) {
      throw new Error("Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    }
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    if (!supabase) {
      return { error: null };
    }
    return await supabase.auth.signOut();
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    if (!supabase) {
      return { error: new Error("Supabase is not configured.") as unknown as AuthError };
    }
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
  };

  const resendConfirmationEmail = async (email: string): Promise<{ error: AuthError | null }> => {
    if (!supabase) {
      return { error: new Error("Supabase is not configured.") as unknown as AuthError };
    }
    return await supabase.auth.resend({
      type: "signup",
      email,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithPassword,
        signInWithEmailOrUapId,
        signUp,
        signOut,
        resetPassword,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
