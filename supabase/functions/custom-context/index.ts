import { createSupabaseContext } from "npm:@supabase/server@1";

Deno.serve(async (request: Request) => {
  const { data: context, error } = await createSupabaseContext(request, {
    auth: "user",
  });

  if (error) {
    return Response.json(
      { message: error.message, code: error.code },
      { status: error.status },
    );
  }

  const { data, error: queryError } = await context.supabase
    .from("todos")
    .select();

  if (queryError) {
    return Response.json(
      { message: queryError.message },
      { status: 500 },
    );
  }

  return Response.json(data);
});
