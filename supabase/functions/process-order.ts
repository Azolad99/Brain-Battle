import { withSupabase } from "npm:@supabase/server@1";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default {
  fetch: withSupabase(
    { auth: "secret" },
    async (request, context) => {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
      }

      if (
        typeof body !== "object" ||
        body === null ||
        !("orderId" in body) ||
        typeof body.orderId !== "string" ||
        !UUID_PATTERN.test(body.orderId)
      ) {
        return Response.json({ error: "A valid orderId is required." }, { status: 400 });
      }

      const { data, error } = await context.supabaseAdmin
        .from("orders")
        .update({ status: "processing" })
        .eq("id", body.orderId)
        .select()
        .single();

      if (error?.code === "PGRST116") {
        return Response.json({ error: "Order not found." }, { status: 404 });
      }
      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json(data);
    },
  ),
};
