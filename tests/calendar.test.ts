import assert from 'node:assert/strict';
import test from 'node:test';

import {
  activityValidationErrors,
  dateFromKey,
  formatTimeRange,
  getMonthGridDays,
  getWeekDays,
  sortActivities,
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
