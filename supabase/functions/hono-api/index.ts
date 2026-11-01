import { Hono } from "npm:hono";
import { withRequiredClaims } from "npm:@supabase/server@1/middleware/required-claims";
import { withSupabaseClient } from "npm:@supabase/server@1/middleware/client";

import { toHono } from "./lib/supabase-middleware.ts";

const app = new Hono()
  .use("*", toHono([withRequiredClaims(), withSupabaseClient()]))
  .get("/todos", async (context) => {
    const { data, error } = await context.var.supabase.from("todos").select();
    if (error) return context.json({ error: error.message }, 500);
    return context.json(data);
  })
  .get("/me", (context) => context.json({ id: context.var.jwtClaims.sub }));

Deno.serve(app.fetch);
