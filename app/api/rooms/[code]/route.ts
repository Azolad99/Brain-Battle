import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/supabase-admin";
import { normalizeRoomCode } from "@/lib/game-rules";
import { playerSessionCookie } from "@/lib/room-session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code: rawCode } = await context.params;
    const code = normalizeRoomCode(rawCode);
    const sessionToken = (await cookies()).get(playerSessionCookie(code))?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Room session not found. Rejoin the room." }, { status: 401 });
    }

    const { data, error } = await adminDb().rpc("get_room_state", {
      p_code: code,
      p_session_token: sessionToken,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load room state.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
