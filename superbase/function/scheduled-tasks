import { withSupabase } from "npm:@supabase/server@1";

type ScheduledTaskRequest = {
  taskName?: unknown;
  scheduledAt?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default {
  fetch: withSupabase(
    { auth: "secret:automations" },
    async (request, context) => {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
      }

      if (!isRecord(body)) {
        return Response.json({ error: "Request body must be a JSON object." }, { status: 400 });
      }

      const { taskName, scheduledAt } = body as ScheduledTaskRequest;
      if (
        typeof taskName !== "string" ||
        taskName.trim().length < 1 ||
        taskName.trim().length > 120
      ) {
        return Response.json(
          { error: "taskName must contain 1–120 characters." },
          { status: 400 },
        );
      }

      if (
        typeof scheduledAt !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
          scheduledAt,
        ) ||
        !Number.isFinite(Date.parse(scheduledAt))
      ) {
        return Response.json(
          { error: "scheduledAt must be a valid ISO 8601 timestamp with a timezone." },
          { status: 400 },
        );
      }

      const { data, error } = await context.supabaseAdmin
        .from("scheduled_tasks")
        .insert({
          name: taskName.trim(),
          scheduled_at: new Date(scheduledAt).toISOString(),
        })
        .select("id, name, scheduled_at, created_at")
        .single();

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true, data }, { status: 201 });
    },
  ),
};
