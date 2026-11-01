import { describe, expect, it } from 'vitest';
import { calculatePoints } from '../lib/questions';
import { normalizeNickname, normalizeRoomCode, MIN_PLAYERS, MAX_PLAYERS } from '../lib/game-rules';
describe('Brain Battle rules', () => {
 it('awards no points for wrong answers', () => expect(calculatePoints(false, 0)).toBe(0));
 it('awards base and maximum speed points instantly', () => expect(calculatePoints(true, 0)).toBe(1500));
 it('awards base points at the deadline', () => expect(calculatePoints(true, 15000)).toBe(1000));
 it('doubles a correct answer when Double Points is active', () => expect(calculatePoints(true, 15000, true)).toBe(2000));
 it('validates nicknames', () => { expect(normalizeNickname('  Quiz Hero ')).toBe('Quiz Hero'); expect(() => normalizeNickname('x')).toThrow(); });
 it('validates room codes', () => { expect(normalizeRoomCode('ab234c')).toBe('AB234C'); expect(() => normalizeRoomCode('123')).toThrow(); });
 it('defines a 4–8 player room', () => { expect(MIN_PLAYERS).toBe(4); expect(MAX_PLAYERS).toBe(8); });
});
