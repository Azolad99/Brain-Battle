import { describe, expect, it } from 'vitest';
import { calculatePoints, chooseQuestions, QUESTIONS } from '../lib/questions';
import { normalizeNickname, normalizeRoomCode, MIN_PLAYERS, MAX_PLAYERS } from '../lib/game-rules';
describe('Brain Battle rules', () => {
 it('awards no points for wrong answers', () => expect(calculatePoints(false, 0)).toBe(0));
 it('awards base and maximum speed points instantly', () => expect(calculatePoints(true, 0)).toBe(1500));
 it('awards base points at the deadline', () => expect(calculatePoints(true, 15000)).toBe(1000));
 it('doubles a correct answer when Double Points is active', () => expect(calculatePoints(true, 15000, true)).toBe(2000));
 it('validates nicknames', () => { expect(normalizeNickname('  Quiz Hero ')).toBe('Quiz Hero'); expect(() => normalizeNickname('x')).toThrow(); });
 it('validates room codes', () => { expect(normalizeRoomCode('ab234c')).toBe('AB234C'); expect(() => normalizeRoomCode('123')).toThrow(); });
 it('defines a 4–8 player room', () => { expect(MIN_PLAYERS).toBe(4); expect(MAX_PLAYERS).toBe(8); });
 it('contains 36 sports, 13 science, and 13 space questions with unique IDs and valid options', () => {
  expect(QUESTIONS).toHaveLength(72);
  expect(QUESTIONS.filter((question) => question.category === 'Sports')).toHaveLength(36);
  expect(QUESTIONS.filter((question) => question.category === 'Science')).toHaveLength(13);
  expect(QUESTIONS.filter((question) => question.category === 'Space')).toHaveLength(13);
  expect(new Set(QUESTIONS.map((question) => question.id)).size).toBe(QUESTIONS.length);
  for (const question of QUESTIONS) {
   expect(question.options).toHaveLength(4);
   expect(question.correctIndex).toBeGreaterThanOrEqual(0);
   expect(question.correctIndex).toBeLessThan(question.options.length);
  }
 });
 it('selects six distinct questions for a match', () => {
  const selected = chooseQuestions(6);
  expect(selected).toHaveLength(6);
  expect(new Set(selected.map((question) => question.id)).size).toBe(6);
 });
 it('returns a whole number of questions within the available range', () => {
