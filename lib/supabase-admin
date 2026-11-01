import { createAdminClient } from '@supabase/server/core';

export function adminDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key || key === 'YOUR_SERVER_ONLY_SUPABASE_SECRET_KEY') {
    throw new Error(
      'Backend is not configured yet. Set SUPABASE_URL and a server-only SUPABASE_SECRET_KEY in your environment.',
    );
  }

  return createAdminClient();
}
