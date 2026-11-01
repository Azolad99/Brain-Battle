import { randomBytes, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/supabase-admin";
import { normalizeNickname } from "@/lib/game-rules";
import { chooseQuestions } from "@/lib/questions";
import { playerSessionCookie } from "@/lib/room-session";

export const runtime = "nodejs";
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createRoomCode() {
  return Array.from(
    { length: 6 },
    () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)],
  ).join("");
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("nickname" in body)) {
      return NextResponse.json({ error: "Enter a nickname to create a room." }, { status: 400 });
    }

    const nickname = normalizeNickname(String(body.nickname));
    const sessionToken = randomBytes(32).toString("base64url");
    const db = adminDb();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await db.rpc("create_room", {
        p_code: createRoomCode(),
        p_nickname: nickname,
        p_session_token: sessionToken,
        p_questions: chooseQuestions(6),
      });

      if (!error && data) {
        const roomCode = String(data.roomCode);
        const response = NextResponse.json({ roomCode, state: data.state });
        response.cookies.set(playerSessionCookie(roomCode), sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: `/api/rooms/${roomCode}`,
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }

      if (error?.code !== "23505") {
        throw new Error(error?.message ?? "Unable to create the room.");
      }
    }

    throw new Error("Could not reserve a room code. Please try again.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create room.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
