import { withSupabase } from "npm:@supabase/server@1";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
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

    const { data: order, error: lookupError } = await context.supabase
      .from("orders")
      .select("id")
      .eq("id", body.orderId)
      .eq("user_id", context.userClaims.id)
      .maybeSingle();

    if (lookupError) {
      return Response.json({ error: lookupError.message }, { status: 500 });
    }
    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    const { data, error } = await context.supabaseAdmin.functions.invoke(
      "process-order",
      { body: { orderId: order.id } },
    );

    if (error) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    return Response.json(data);
  }),
};
