"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RoomResponse = { roomCode?: string; error?: string };

export default function Home() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function enterRoom(event: FormEvent<HTMLFormElement>, action: "create" | "join") {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch(action === "create" ? "/api/rooms" : "/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, roomCode }),
      });
      const result = (await response.json()) as RoomResponse;
      if (!response.ok || !result.roomCode) {
        throw new Error(result.error ?? "Unable to enter the room.");
      }
      router.push(`/room/${result.roomCode}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to enter the room.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <div className="w-full max-w-2xl text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-cyan-400">
          The ultimate trivia showdown
        </p>
        <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
          BRAIN <span className="text-fuchsia-500">BATTLE</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-slate-400">
          Six questions. Fifteen seconds each. One gloriously chaotic battle.
        </p>

        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <label htmlFor="nickname" className="mb-2 block text-left text-sm font-semibold text-slate-300">
            Choose your battle nickname
          </label>
          <input
            id="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value.slice(0, 18))}
            placeholder="e.g. Quizasaurus"
            maxLength={18}
            minLength={2}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-400"
          />

          <form onSubmit={(event) => void enterRoom(event, "create")}>
            <button
              type="submit"
              disabled={busy || nickname.trim().length < 2}
              className="mt-4 w-full rounded-xl bg-fuchsia-600 px-5 py-4 font-bold transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Connecting..." : "⚔️ Create a Room"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            <div className="h-px flex-1 bg-slate-700" />
            Or join a battle
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <form onSubmit={(event) => void enterRoom(event, "join")}>
            <label htmlFor="roomCode" className="mb-2 block text-left text-sm font-semibold text-slate-300">
              Six-character room code
            </label>
            <input
              id="roomCode"
              value={roomCode}
              onChange={(event) =>
                setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
              }
              placeholder="ABC123"
              maxLength={6}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center font-mono text-xl tracking-[0.3em] outline-none transition focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={busy || nickname.trim().length < 2 || roomCode.length !== 6}
              className="mt-3 w-full rounded-xl border border-cyan-500 px-5 py-3 font-bold text-cyan-300 transition hover:bg-cyan-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join Room →
            </button>
          </form>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-950 p-3 text-left text-sm text-red-200">{error}</p>}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-slate-400">
          <span className="rounded-full border border-slate-800 px-4 py-2">👥 4–8 players</span>
          <span className="rounded-full border border-slate-800 px-4 py-2">⏱️ 3–5 minutes</span>
          <span className="rounded-full border border-slate-800 px-4 py-2">🏆 Maximum chaos</span>
        </div>
      </div>
    </main>
  );
}
