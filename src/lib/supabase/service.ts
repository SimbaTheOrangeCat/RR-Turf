import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

export function createServiceRoleClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for server-only operations (e.g. webhooks).");
  }
  const { supabaseUrl } = getSupabaseEnv();
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
