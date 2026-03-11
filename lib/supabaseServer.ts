import { createClient } from '@supabase/supabase-js';

type Env = {
  url: string;
  serviceRoleKey: string;
};

function getEnv(): Env | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

export function getSupabaseServerClient() {
  const env = getEnv();
  if (!env) return null;
  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

