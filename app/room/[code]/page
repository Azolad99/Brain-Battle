"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type GamePhase = "lobby" | "question" | "reveal" | "finished" | "closed";
type Question = {
  category: string;
  prompt: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
};
type Player = {
  id: string;
  nickname: string;
  isHost: boolean;
  score: number;
  connected: boolean;
  answerSubmitted: boolean;
  powerups: Record<string, number>;
};
type RoomState = {
  room: {
    code: string;
    phase: GamePhase;
    questionIndex: number;
    questionCount: number;
    updatedAt: string;
    deadline: string | null;
    advanceDeadline: string | null;
  };
  playerDeadline: string | null;
  question: Question | null;
  players: Player[];
  myPlayerId: string;
  myAnswer: { optionIndex: number; isCorrect: boolean | null; pointsAwarded: number | null } | null;
};

const buttonClass =
  "rounded-xl border border-slate-700 px-4 py-3 font-semibold transition hover:border-cyan-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

function requestId() {
  return globalThis.crypto.randomUUID();
}

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const operationIds = useRef(new Map<string, string>());
  const isHost = state?.players.some(
    (player) => player.id === state.myPlayerId && player.isHost,
  ) ?? false;

  const loadState = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${code}`, { cache: "no-store" });
      const payload = (await response.json()) as RoomState & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load this room.");
      setState(payload);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Connection interrupted. Reconnecting...");
    }
  }, [code]);

  const performAction = useCallback(
    async (action: string, values: Record<string, string | number> = {}, stableKey?: string) => {
      const idKey = stableKey ?? `${action}:${crypto.randomUUID()}`;
      const id = operationIds.current.get(idKey) ?? requestId();
      operationIds.current.set(idKey, id);
      setBusy(true);
      try {
        const response = await fetch(`/api/rooms/${code}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...values, requestId: id }),
        });
        const payload = (await response.json()) as RoomState & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to perform that action.");
        setState(payload);
        setError("");
        return true;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to perform that action.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [code],
  );

  useEffect(() => {
    void loadState();
    const poll = window.setInterval(() => void loadState(), 1500);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    const refresh = () => void loadState();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadState]);

  useEffect(() => {
    if (!state) return;
    const { room, players } = state;
    if (
      room.phase === "question" &&
      room.advanceDeadline &&
      Date.now() >= Date.parse(room.advanceDeadline)
    ) {
      void performAction(
        "advance_round",
        { questionIndex: room.questionIndex },
        `question-deadline:${code}:${room.questionIndex}`,
      );
    } else if (
      room.phase === "reveal" &&
      Date.now() >= Date.parse(room.updatedAt) + 3000
    ) {
      void performAction(
        "advance_round",
        { questionIndex: room.questionIndex },
        `question-reveal:${code}:${room.questionIndex}`,
      );
    } else if (
      room.phase === "question" &&
      players.length > 0 &&
      players.every((player) => player.answerSubmitted)
    ) {
      void performAction(
        "advance_round",
        { questionIndex: room.questionIndex },
        `question-complete:${code}:${room.questionIndex}`,
      );
    }
  }, [code, isHost, performAction, state]);

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      setError("Could not copy the room code. You can select and copy it manually.");
    }
  }

  if (!state) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 text-white">
        <p className="text-cyan-300">Reconnecting to room {code}…</p>
        {error && <p role="alert" className="mt-4 text-red-300">{error}</p>}
        <Link href="/" className="mt-6 text-slate-400 underline">Return to the home page</Link>
      </main>
    );
  }

  const myPlayer = state.players.find((player) => player.id === state.myPlayerId);
  const remainingMs = state.playerDeadline ? Math.max(0, Date.parse(state.playerDeadline) - now) : 0;
  const waitingForPlayers = state.players.filter((player) => player.answerSubmitted).length;
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <Link href="/" className="font-black tracking-tight">BRAIN <span className="text-fuchsia-500">BATTLE</span></Link>
          <button type="button" onClick={() => void copyRoomCode()} className={buttonClass}>
            Room {code} · Copy code
          </button>
        </header>

        {error && <p role="alert" className="mb-5 rounded-xl border border-red-900 bg-red-950 p-4 text-sm text-red-200">{error}</p>}

        {state.room.phase === "lobby" && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Battle lobby</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Gather your crew.</h1>
            <p className="mt-2 text-slate-400">The host can start when four or more players have joined.</p>
            <PlayerList players={state.players} me={state.myPlayerId} />
            <div className="mt-6 flex flex-wrap gap-3">
              {isHost ? (
                <button
                  type="button"
                  disabled={busy || state.players.length < 4}
                  onClick={() => void performAction("start_match", {}, `start:${code}`)}
                  className="rounded-xl bg-fuchsia-600 px-5 py-3 font-bold hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state.players.length < 4 ? `Need ${4 - state.players.length} more players` : "Start battle"}
                </button>
              ) : (
                <p className="rounded-xl bg-slate-800 px-4 py-3 text-slate-300">Waiting for the host to start…</p>
              )}
              {isHost && (
                <button type="button" disabled={busy} onClick={() => void performAction("close_room")} className={buttonClass}>
                  Close room
                </button>
              )}
            </div>
          </section>
        )}

        {state.room.phase === "question" && state.question && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">{state.question.category}</p>
                <p className="mt-2 text-sm text-slate-400">Question {state.room.questionIndex + 1} of {state.room.questionCount}</p>
              </div>
              <div aria-live="polite" className="rounded-xl bg-slate-800 px-4 py-2 text-xl font-black tabular-nums">
                {Math.ceil(remainingMs / 1000)}s
              </div>
            </div>
            <h1 className="mt-7 text-2xl font-black leading-snug sm:text-3xl">{state.question.prompt}</h1>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {state.question.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  disabled={busy || !!state.myAnswer || remainingMs === 0}
                  onClick={() => void performAction("submit_answer", {
                    questionIndex: state.room.questionIndex,
                    optionIndex: index,
                  })}
                  className={`${buttonClass} text-left ${state.myAnswer?.optionIndex === index ? "border-cyan-400 bg-cyan-950" : ""}`}
                >
                  <span className="mr-3 text-cyan-300">{String.fromCharCode(65 + index)}.</span>{option}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <PowerupButton
                label="Double points"
                remaining={myPlayer?.powerups.double_points ?? 0}
                disabled={busy || !!state.myAnswer}
                onClick={() => void performAction("use_powerup", { powerup: "double_points" })}
              />
              <PowerupButton
                label="Freeze clock"
                remaining={myPlayer?.powerups.freeze_clock ?? 0}
                disabled={busy || !!state.myAnswer}
                onClick={() => void performAction("use_powerup", { powerup: "freeze_clock" })}
              />
            </div>
            <p className="mt-5 text-sm text-slate-400" aria-live="polite">
              {state.myAnswer
                ? "Answer locked. Waiting for the rest of the crew…"
                : `${waitingForPlayers} of ${state.players.length} players answered.`}
            </p>
          </section>
        )}

        {state.room.phase === "reveal" && state.question && (
          <section className="rounded-3xl border border-cyan-900 bg-slate-900 p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Answer reveal</p>
            <h1 className="mt-4 text-2xl font-black sm:text-3xl">{state.question.prompt}</h1>
            <p className="mt-5 rounded-xl bg-emerald-950 p-4 font-bold text-emerald-200">
              Correct answer: {state.question.options[state.question.correctIndex ?? 0]}
            </p>
            <p className="mt-4 text-slate-300">{state.question.explanation}</p>
            {state.myAnswer && (
              <p className="mt-4 text-cyan-200">
                {state.myAnswer.isCorrect ? `Correct! +${state.myAnswer.pointsAwarded} points.` : "Not quite. Better luck next round!"}
              </p>
            )}
            <Scoreboard players={sortedPlayers} me={state.myPlayerId} />
            <p className="mt-5 text-sm text-slate-400">
              The next round starts automatically…
            </p>
          </section>
        )}

        {state.room.phase === "finished" && (
          <section className="rounded-3xl border border-fuchsia-900 bg-slate-900 p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-300">Battle complete</p>
            <h1 className="mt-4 text-3xl font-black sm:text-4xl">
              {winner ? `${winner.nickname} takes the crown!` : "What a battle!"}
            </h1>
            <Scoreboard players={sortedPlayers} me={state.myPlayerId} />
            {isHost ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void performAction("rematch", {}, `rematch:${code}:${Date.now()}`)}
                className="mt-6 rounded-xl bg-fuchsia-600 px-5 py-3 font-bold hover:bg-fuchsia-500 disabled:opacity-50"
              >
                Play a rematch
              </button>
            ) : (
              <p className="mt-6 text-slate-400">The host can start a rematch for everyone.</p>
            )}
          </section>
        )}

        {state.room.phase === "closed" && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <h1 className="text-3xl font-black">This room is closed.</h1>
            <Link href="/" className="mt-6 inline-block rounded-xl bg-fuchsia-600 px-5 py-3 font-bold">Back to Brain Battle</Link>
          </section>
        )}

        <aside className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="font-bold text-slate-300">Scoreboard</h2>
          <Scoreboard players={sortedPlayers} me={state.myPlayerId} />
        </aside>
      </div>
    </main>
  );
}

function PlayerList({ players, me }: { players: Player[]; me: string }) {
  return (
    <ul className="mt-6 grid gap-2 sm:grid-cols-2">
      {players.map((player) => (
        <li key={player.id} className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3">
          <span>{player.nickname}{player.id === me ? " (you)" : ""}{player.isHost ? " · host" : ""}</span>
          <span className={`text-xs ${player.connected ? "text-emerald-300" : "text-slate-500"}`}>
            {player.connected ? "● online" : "○ reconnecting"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Scoreboard({ players, me }: { players: Player[]; me: string }) {
  return (
    <ol className="mt-6 space-y-2">
      {players.map((player, index) => (
        <li key={player.id} className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3">
          <span><span className="mr-3 text-slate-500">{index + 1}.</span>{player.nickname}{player.id === me ? " (you)" : ""}</span>
          <strong className="tabular-nums">{player.score.toLocaleString()}</strong>
        </li>
      ))}
    </ol>
  );
}

function PowerupButton({
  label,
  remaining,
  disabled,
  onClick,
}: {
  label: string;
  remaining: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" disabled={disabled || remaining < 1} onClick={onClick} className={buttonClass}>
      {label} · {remaining} left
    </button>
  );
}
