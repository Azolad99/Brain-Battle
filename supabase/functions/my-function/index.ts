import { fromSupabaseUrl, withSupabase } from "npm:@supabase/server@1";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
if (!supabaseUrl) {
  throw new Error("SUPABASE_URL must be configured for this Edge Function.");
}

export default {
  fetch: withSupabase(
    {
      auth: "user",
      issuer: fromSupabaseUrl(supabaseUrl),
    },
    async (_request, context) =>
      Response.json({ user: context.userClaims }),
  ),
};
