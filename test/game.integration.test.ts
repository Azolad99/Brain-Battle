import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.BRAIN_BATTLE_TEST_BASE_URL?.replace(/\/$/, "");
const enabled = Boolean(baseUrl);

type ApiResult = {
  roomCode?: string;
  room?: { phase: string; questionIndex: number };
  players?: Array<{ id: string; score: number; powerups?: Record<string, number> }>;
  question?: { correctIndex?: number } | null;
  myPlayerId?: string;
  playerDeadline?: string | null;
  error?: string;
};

type TestClient = { cookie: string };

function readCookie(response: Response) {
  const setCookies = response.headers.getSetCookie();
  const cookie = setCookies.find((value) => value.startsWith("brain_battle_"));
  if (!cookie) throw new Error("Server did not issue an HttpOnly room-session cookie.");
  return cookie.split(";", 1)[0];
}

async function post(
  client: TestClient,
  path: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: client.cookie,
    },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as ApiResult;
  if (!response.ok) throw new Error(result.error ?? `Request failed: ${response.status}`);
  return result;
}

async function get(client: TestClient, path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Cookie: client.cookie },
    cache: "no-store",
  });
  const result = (await response.json()) as ApiResult;
  if (!response.ok) throw new Error(result.error ?? `Request failed: ${response.status}`);
  return result;
}

describe.skipIf(!enabled)("four-player multiplayer integration", () => {
  const clients: TestClient[] = [];
  let roomCode = "";

  beforeAll(async () => {
    const response = await fetch(`${baseUrl}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: `Host${Date.now()}`.slice(0, 18) }),
    });
    const result = (await response.json()) as ApiResult;
    if (!response.ok || !result.roomCode) {
      throw new Error(result.error ?? "Could not create an integration-test room.");
    }

    roomCode = result.roomCode;
    clients.push({ cookie: readCookie(response) });
    expect(JSON.stringify(result)).not.toContain("playerToken");

    for (let index = 1; index < 4; index += 1) {
      const joinResponse = await fetch(`${baseUrl}/api/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          nickname: `Player${index}-${Date.now()}`.slice(0, 18),
        }),
      });
      const joined = (await joinResponse.json()) as ApiResult;
      if (!joinResponse.ok) {
        throw new Error(joined.error ?? "Could not join integration-test room.");
      }
      clients.push({ cookie: readCookie(joinResponse) });
    }
  }, 30_000);

  afterAll(async () => {
    if (roomCode && clients[0]) {
      await post(clients[0], `/api/rooms/${roomCode}/actions`, {
        action: "close_room",
        requestId: crypto.randomUUID(),
      }).catch(() => undefined);
    }
  });

  it("isolates four sessions, runs all rounds, and supports a rematch", async () => {
    const initialStates = await Promise.all(
      clients.map((client) => get(client, `/api/rooms/${roomCode}`)),
    );
    expect(new Set(initialStates.map((state) => state.myPlayerId)).size).toBe(4);
    expect(initialStates.map((state) => state.players?.length)).toEqual([4, 4, 4, 4]);

    const startId = crypto.randomUUID();
    const started = await post(clients[0], `/api/rooms/${roomCode}/actions`, {
      action: "start_match",
      requestId: startId,
    });
    expect(started.room?.phase).toBe("question");
    expect(
      (
        await post(clients[0], `/api/rooms/${roomCode}/actions`, {
          action: "start_match",
          requestId: startId,
        })
      ).room?.questionIndex,
    ).toBe(0);

    for (let questionIndex = 0; questionIndex < 6; questionIndex += 1) {
      const current = await get(clients[0], `/api/rooms/${roomCode}`);
      expect(current.room?.phase).toBe("question");
      expect(current.room?.questionIndex).toBe(questionIndex);
      expect(current.question).not.toHaveProperty("correctIndex");

      if (questionIndex === 0) {
        await post(clients[0], `/api/rooms/${roomCode}/actions`, {
          action: "use_powerup",
          powerup: "double_points",
          requestId: crypto.randomUUID(),
        });
      }

      if (questionIndex === 1) {
        const frozen = await post(clients[1], `/api/rooms/${roomCode}/actions`, {
          action: "use_powerup",
          powerup: "freeze_clock",
          requestId: crypto.randomUUID(),
        });
        expect(Date.parse(frozen.playerDeadline ?? "") - Date.now()).toBeGreaterThan(16_000);

        for (const playerIndex of [0, 2, 3]) {
          const playerState = await get(clients[playerIndex], `/api/rooms/${roomCode}`);
          await post(clients[playerIndex], `/api/rooms/${roomCode}/actions`, {
            action: "submit_answer",
            questionIndex,
            optionIndex: 0,
            requestId: crypto.randomUUID(),
          });
          expect(playerState.room?.phase).toBe("question");
        }

        await new Promise((resolve) => setTimeout(resolve, 15_200));
        await post(clients[1], `/api/rooms/${roomCode}/actions`, {
          action: "submit_answer",
          questionIndex,
          optionIndex: 0,
          requestId: crypto.randomUUID(),
        });
      } else {
        for (let playerIndex = 0; playerIndex < clients.length; playerIndex += 1) {
          const answerId = crypto.randomUUID();
          await post(clients[playerIndex], `/api/rooms/${roomCode}/actions`, {
            action: "submit_answer",
            questionIndex,
            optionIndex: 0,
            requestId: answerId,
          });
        }
      }

      const reveal = await get(clients[0], `/api/rooms/${roomCode}`);
      expect(reveal.room?.phase).toBe("reveal");
      expect(reveal.question).toHaveProperty("correctIndex");
      expect(reveal.myPlayerId).toBe(initialStates[0].myPlayerId);
      if (questionIndex === 0) {
        expect(
          reveal.players?.find((player) => player.id === initialStates[0].myPlayerId)?.powerups
            ?.double_points,
        ).toBe(0);
      }

      await new Promise((resolve) => setTimeout(resolve, 3100));
      const advanceId = crypto.randomUUID();
      const advanced = await post(clients[0], `/api/rooms/${roomCode}/actions`, {
        action: "advance_round",
        questionIndex,
        requestId: advanceId,
      });
      const retried = await post(clients[0], `/api/rooms/${roomCode}/actions`, {
        action: "advance_round",
        questionIndex,
        requestId: advanceId,
      });
      expect(retried.room?.questionIndex).toBe(advanced.room?.questionIndex);
      expect(retried.room?.phase).toBe(advanced.room?.phase);
      if (questionIndex === 5) expect(advanced.room?.phase).toBe("finished");
      else expect(advanced.room?.questionIndex).toBe(questionIndex + 1);
    }

    const finished = await get(clients[0], `/api/rooms/${roomCode}`);
    expect(finished.players).toHaveLength(4);
    expect(
      finished.players?.find((player) => player.id === initialStates[0].myPlayerId)?.score,
    ).toBeGreaterThanOrEqual(0);

    const rematch = await post(clients[0], `/api/rooms/${roomCode}/actions`, {
      action: "rematch",
      requestId: crypto.randomUUID(),
    });
    expect(rematch.room?.phase).toBe("lobby");
    expect(rematch.players?.every((player) => player.score === 0)).toBe(true);
  }, 120_000);
});
