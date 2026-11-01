import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/supabase-admin";
import { normalizeNickname, normalizeRoomCode } from "@/lib/game-rules";
import { playerSessionCookie } from "@/lib/room-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("nickname" in body) ||
      !("roomCode" in body)
    ) {
      return NextResponse.json(
        { error: "Enter a nickname and room code." },
        { status: 400 },
      );
    }

    const nickname = normalizeNickname(String(body.nickname));
    const roomCode = normalizeRoomCode(String(body.roomCode));
    const sessionToken = randomBytes(32).toString("base64url");
    const { data, error } = await adminDb().rpc("join_room", {
      p_code: roomCode,
      p_nickname: nickname,
      p_session_token: sessionToken,
    });

    if (error) throw new Error(error.message);
    const response = NextResponse.json({ roomCode, state: data.state });
    response.cookies.set(playerSessionCookie(roomCode), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: `/api/rooms/${roomCode}`,
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to join room.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
