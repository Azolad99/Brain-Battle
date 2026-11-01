import { withSupabase } from "npm:@supabase/server@1";
import Stripe from "npm:stripe";

export default {
  fetch: withSupabase({ auth: "none" }, async (request, context) => {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeSecretKey || !webhookSecret) {
      return Response.json(
        { error: "Stripe webhook secrets are not configured." },
        { status: 500 },
      );
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return Response.json({ error: "Missing Stripe signature." }, { status: 401 });
    }

    const body = await request.text();
    const stripe = new Stripe(stripeSecretKey);
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
      );
    } catch {
      return Response.json({ error: "Invalid signature." }, { status: 401 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session.id) {
        return Response.json(
          { error: "Stripe checkout session is missing its ID." },
          { status: 400 },
        );
      }

      const { error } = await context.supabaseAdmin.rpc(
        "process_stripe_checkout_event",
        {
          p_event_id: event.id,
          p_event_type: event.type,
          p_session_id: session.id,
        },
      );

      if (error) {
        return Response.json(
          { error: "Unable to process the checkout event." },
          { status: 500 },
        );
      }
    }

    return Response.json({ received: true });
  }),
};
