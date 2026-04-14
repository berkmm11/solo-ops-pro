import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  specialty: string | null;
  tax_no: string | null;
  address: string | null;
  iban: string | null;
  bank_name: string | null;
  brand_name: string | null;
  logo_url: string | null;
  onboarding_completed: boolean;
  invoice_template_config: any | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setProfile(data as Profile | null);
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { profile, loading };
};
