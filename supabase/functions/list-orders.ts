import { withSupabase } from "npm:@supabase/server@1";

export default {
  fetch: withSupabase({ auth: "user" }, async (_request, context) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  }),
};
