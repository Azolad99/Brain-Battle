export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;
export const ROUND_MS = 15_000;
export function normalizeNickname(raw: string): string {
 const name = raw.trim().replace(/\s+/g, ' ');
 if (name.length < 2 || name.length > 18) throw new Error('Nickname must be 2–18 characters.');
 if (!/^[\p{L}\p{N} _-]+$/u.test(name)) throw new Error('Use letters, numbers, spaces, underscores, or hyphens.');
 return name;
}
export function normalizeRoomCode(raw: string): string {
 const code = raw.trim().toUpperCase();
 if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) throw new Error('Enter a valid six-character room code.');
 return code;
}
