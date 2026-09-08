import assert from 'node:assert/strict';
import test from 'node:test';

import {
  activityValidationErrors,
  dateFromKey,
  formatTimeRange,
  getMonthGridDays,
  getTimelineRange,
  getWeekDays,
  pokemonGridPosition,
  pokemonNumberFor,
  sortActivities,
  timeToMinutes,
  toDateKey,
  type Activity,
  type ActivityDraft,
} from '../lib/calendar.ts';

void test('week navigation starts on Monday and returns seven dates', () => {
  const days = getWeekDays(dateFromKey('2026-09-08'));
  assert.equal(days.length, 7);
  assert.equal(toDateKey(days[0]), '2026-09-07');
  assert.equal(toDateKey(days[6]), '2026-09-13');
});

void test('monthly plan supplies a six-week Monday-first grid', () => {
  const days = getMonthGridDays(dateFromKey('2026-09-08'));
  assert.equal(days.length, 42);
  assert.equal(toDateKey(days[0]), '2026-08-31');
  assert.equal(toDateKey(days[41]), '2026-10-11');
});

void test('activities sort by date, start time, then title', () => {
  const base: Activity = {
    id: 'a', title: 'Art', date: '2026-09-08', startTime: '16:00', endTime: '17:00',
    child: 'Maya', location: '', notes: '', category: 'clubs', color: 'blue', icon: '🎨',
  };
  const sorted = sortActivities([
    base,
    { ...base, id: 'b', title: 'Piano', startTime: '14:00' },
    { ...base, id: 'c', title: 'Bike', date: '2026-09-07' },
  ]);
  assert.deepEqual(sorted.map((item) => item.id), ['c', 'b', 'a']);
});

void test('activity validation rejects blank names and reversed times', () => {
  const draft: ActivityDraft = {
    title: '', date: '2026-09-08', startTime: '17:00', endTime: '16:00', child: '',
    location: '', notes: '', category: 'other', color: 'yellow', icon: '☀️',
  };
  const errors = activityValidationErrors(draft);
  assert.ok(errors.title);
  assert.ok(errors.child);
  assert.ok(errors.endTime);
});

void test('time ranges are easy to read', () => {
  assert.equal(formatTimeRange('09:05', '13:30'), '9:05 AM–1:30 PM');
});

void test('weekly timeline uses family-friendly hours and expands for early or late plans', () => {
  const base: Activity = {
    id: 'a', title: 'Breakfast club', date: '2026-09-08', startTime: '06:30', endTime: '07:30',
    child: 'Maya', location: '', notes: '', category: 'clubs', color: 'yellow', icon: '★',
  };

  assert.equal(timeToMinutes('16:45'), 1005);
  assert.deepEqual(getTimelineRange([]), { startHour: 7, endHour: 20 });
  assert.deepEqual(
    getTimelineRange([base, { ...base, id: 'b', startTime: '20:15', endTime: '21:30' }]),
    { startHour: 6, endHour: 22 },
  );
});

void test('all 151 Pokémon can be selected from the monthly icon sheet', () => {
  assert.deepEqual(pokemonGridPosition(1), { column: 0, row: 0 });
  assert.deepEqual(pokemonGridPosition(132), { column: 11, row: 10 });
  assert.deepEqual(pokemonGridPosition(133), { column: 0, row: 11 });
  assert.deepEqual(pokemonGridPosition(143), { column: 11, row: 11 });
  assert.deepEqual(pokemonGridPosition(144), { column: 2, row: 12 });
  assert.deepEqual(pokemonGridPosition(151), { column: 10, row: 12 });
  assert.ok(pokemonNumberFor('September 2026') >= 1 && pokemonNumberFor('September 2026') <= 151);
});
