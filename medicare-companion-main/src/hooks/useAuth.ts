import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setLoading(false);
      } else {
        // Auto sign-in anonymously so the app "just works" without a login page.
        const { data: anon } = await supabase.auth.signInAnonymously();
        setSession(anon.session ?? null);
        setUser(anon.user ?? null);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}
