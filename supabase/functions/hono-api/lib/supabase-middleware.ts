import type { Context, MiddlewareHandler, Next } from "npm:hono";
import { createMiddleware } from "npm:hono/factory";
import {
  bufferRequest,
  pipeline,
  seedContext,
} from "npm:@supabase/middleware";
import type {
  AnyEntry,
  Contributions,
  ValidateEntries,
} from "npm:@supabase/middleware";

type Bridge<Entries extends readonly AnyEntry[]> = [
  ValidateEntries<Entries>,
] extends [true]
  ? MiddlewareHandler<{ Variables: Contributions<Entries> }>
  : ValidateEntries<Entries>;

const HANDOFF = Symbol("toHono.handoff");

interface Handoff {
  context: Context;
  next: Next;
}

export function toHono<const Entries extends readonly AnyEntry[]>(
  entries: Entries,
): Bridge<Entries> {
  const run = pipeline(entries, async (_request, context) => {
    const { context: honoContext, next } = context[
      HANDOFF
    ] as Record<symbol, Handoff>[typeof HANDOFF];

    for (const [key, value] of Object.entries(context)) {
      honoContext.set(key as never, value as never);
    }

    await next();
    return honoContext.res;
  });

  return createMiddleware(async (context, next) => {
    if (context.req.raw.body) {
      context.req.raw = bufferRequest(context.req.raw);
    }

    const response = await run(context.req.raw, {
      ...seedContext(context.env),
      [HANDOFF]: { context, next } satisfies Handoff,
    });

    if (response !== context.res) {
      context.res = undefined as never;
      context.res = response;
    }
  }) as never;
}
