import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/supabase-admin";
import { normalizeRoomCode } from "@/lib/game-rules";
import { chooseQuestions } from "@/lib/questions";
import { playerSessionCookie } from "@/lib/room-session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ code: string }> };
type ActionBody = {
  action?: unknown;
  questionIndex?: unknown;
  optionIndex?: unknown;
  powerup?: unknown;
  requestId?: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code: rawCode } = await context.params;
    const code = normalizeRoomCode(rawCode);
    const sessionToken = (await cookies()).get(playerSessionCookie(code))?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Room session not found. Rejoin the room." }, { status: 401 });
    }

    const body = (await request.json()) as ActionBody;
    const requestId =
      typeof body.requestId === "string" && UUID_PATTERN.test(body.requestId)
        ? body.requestId
        : randomUUID();
    const db = adminDb();
    let result;

    switch (body.action) {
      case "start_match":
        result = await db.rpc("start_match", {
          p_code: code,
          p_session_token: sessionToken,
          p_request_id: requestId,
        });
        break;
      case "submit_answer":
        if (
          !Number.isInteger(body.questionIndex) ||
          !Number.isInteger(body.optionIndex)
        ) {
          return NextResponse.json({ error: "Choose a valid answer." }, { status: 400 });
        }
        result = await db.rpc("submit_answer", {
          p_code: code,
          p_session_token: sessionToken,
          p_question_index: body.questionIndex,
          p_option_index: body.optionIndex,
          p_request_id: requestId,
        });
        break;
      case "use_powerup":
        if (
          body.powerup !== "double_points" &&
          body.powerup !== "freeze_clock"
        ) {
          return NextResponse.json({ error: "Choose a valid power-up." }, { status: 400 });
        }
        result = await db.rpc("use_powerup", {
          p_code: code,
          p_session_token: sessionToken,
          p_powerup: body.powerup,
          p_request_id: requestId,
        });
        break;
      case "advance_round":
        if (!Number.isInteger(body.questionIndex)) {
          return NextResponse.json({ error: "Question index is required." }, { status: 400 });
        }
        result = await db.rpc("advance_round", {
          p_code: code,
          p_session_token: sessionToken,
          p_expected_question: body.questionIndex,
          p_request_id: requestId,
        });
        break;
      case "close_room":
        result = await db.rpc("close_room", {
          p_code: code,
          p_session_token: sessionToken,
          p_request_id: requestId,
        });
        break;
      case "rematch":
        result = await db.rpc("rematch", {
          p_code: code,
          p_session_token: sessionToken,
          p_questions: chooseQuestions(6),
          p_request_id: requestId,
        });
        break;
      default:
        return NextResponse.json({ error: "Unknown game action." }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to perform game action.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
