import { createContextClient, verifyCredentials } from "@supabase/server/core";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

type AuthenticationError = {
  code: string;
  message: string;
  status: number;
};

export async function createAuthenticatedClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();
  const sessionClient = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies; middleware refreshes them.
        }
      },
    },
  });

  const {
    data: { session },
    error: sessionError,
  } = await sessionClient.auth.getSession();

  if (sessionError) {
    return {
      data: null,
      error: {
        code: "SESSION_ERROR",
        message: sessionError.message,
        status: 401,
      } satisfies AuthenticationError,
    };
  }

  if (!session?.access_token) {
    return {
      data: null,
      error: {
        code: "MISSING_SESSION",
        message: "A signed-in Supabase user is required.",
        status: 401,
      } satisfies AuthenticationError,
    };
  }

  const { data: auth, error: authError } = await verifyCredentials(
    { token: session.access_token, apikey: null },
    { auth: "user" },
  );

  if (authError) {
    return {
      data: null,
      error: {
        code: authError.code,
        message: authError.message,
        status: authError.status,
      } satisfies AuthenticationError,
    };
  }

  return {
    data: {
      auth,
      supabase: createContextClient({
        auth: { token: auth.token, keyName: auth.keyName },
      }),
    },
    error: null,
  };
}
