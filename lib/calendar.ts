export type ViewMode = 'week' | 'month';

export type ActivityCategory =
  | 'school'
  | 'sports'
  | 'music'
  | 'clubs'
  | 'homework'
  | 'appointment'
  | 'family'
  | 'other';

export type ActivityColor =
  | 'coral'
  | 'violet'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'pink';

export type Activity = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  child: string;
  location: string;
  notes: string;
  category: ActivityCategory;
  color: ActivityColor;
  icon: string;
};

export type ActivityDraft = Omit<Activity, 'id'>;

export const categoryOptions: Array<{
  value: ActivityCategory;
  label: string;
  icon: string;
  color: ActivityColor;
}> = [
  { value: 'school', label: 'School', icon: '🎒', color: 'blue' },
  { value: 'sports', label: 'Sports', icon: '⚽', color: 'coral' },
  { value: 'music', label: 'Music', icon: '♫', color: 'violet' },
  { value: 'clubs', label: 'Clubs', icon: '★', color: 'yellow' },
  { value: 'homework', label: 'Homework', icon: '✏️', color: 'pink' },
  { value: 'appointment', label: 'Appointment', icon: '🩺', color: 'green' },
  { value: 'family', label: 'Family', icon: '♥', color: 'green' },
  { value: 'other', label: 'Other', icon: '☀️', color: 'yellow' },
];

export const colorOptions: Array<{ value: ActivityColor; label: string }> = [
  { value: 'coral', label: 'Coral' },
  { value: 'violet', label: 'Violet' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'pink', label: 'Pink' },
];

export const iconOptions = ['⚽', '🏀', '🏊', '🎒', '📚', '✏️', '♫', '🎨', '★', '🩺', '🚲', '♥', '☀️'];

export const POKEMON_COUNT = 151;

export function pokemonGridPosition(number: number): { column: number; row: number } {
  const normalized = Math.min(POKEMON_COUNT, Math.max(1, number));
  if (normalized <= 132) {
    return { column: (normalized - 1) % 12, row: Math.floor((normalized - 1) / 12) };
  }
  if (normalized <= 143) {
    const penultimateRowColumns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11];
    return { column: penultimateRowColumns[normalized - 133], row: 11 };
  }
  const finalRowColumns = [2, 3, 5, 6, 7, 8, 9, 10];
  return { column: finalRowColumns[normalized - 144], row: 12 };
}

export function pokemonNumberFor(value: string): number {
  const hash = Array.from(value).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
  return (hash % POKEMON_COUNT) + 1;
}

export function dateFromKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
  return next;
}

export function startOfPlannerWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return start;
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfPlannerWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function getMonthGridDays(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const start = startOfPlannerWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function formatTime(value: string): string {
  const [hourValue, minuteValue] = value.split(':').map(Number);
  const suffix = hourValue >= 12 ? 'PM' : 'AM';
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minuteValue).padStart(2, '0')} ${suffix}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)}–${formatTime(endTime)}`;
}

export function timeToMinutes(value: string): number {
  if (!/^\d{2}:\d{2}$/.test(value)) return Number.NaN;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return Number.NaN;
  return hours * 60 + minutes;
}

export function getTimelineRange(activities: Activity[]): { startHour: number; endHour: number } {
  let startHour = 7;
  let endHour = 20;

  for (const activity of activities) {
    const start = timeToMinutes(activity.startTime);
    const end = timeToMinutes(activity.endTime);
    if (Number.isFinite(start)) startHour = Math.min(startHour, Math.floor(start / 60));
    if (Number.isFinite(end)) endHour = Math.max(endHour, Math.ceil(end / 60));
  }

  return {
    startHour: Math.max(0, startHour),
    endHour: Math.min(24, endHour),
  };
}

export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) =>
    `${a.date}-${a.startTime}-${a.title}`.localeCompare(`${b.date}-${b.startTime}-${b.title}`),
  );
}

export function activityValidationErrors(draft: ActivityDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.title.trim()) errors.title = 'Give the activity a name.';
  if (!draft.child.trim()) errors.child = 'Add the child or family member.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errors.date = 'Choose a date.';
  if (!/^\d{2}:\d{2}$/.test(draft.startTime)) errors.startTime = 'Choose a start time.';
  if (!/^\d{2}:\d{2}$/.test(draft.endTime)) errors.endTime = 'Choose an end time.';
  if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime) {
    errors.endTime = 'End time must be after the start time.';
  }
  return errors;
}

export function getCategory(value: ActivityCategory) {
  return categoryOptions.find((category) => category.value === value) ?? categoryOptions.at(-1)!;
}

export function childColorIndex(name: string): number {
  return Array.from(name.toLowerCase()).reduce((total, letter) => total + letter.charCodeAt(0), 0) % 6;
}

export function seedDemoActivities(reference = new Date()): Activity[] {
  const week = getWeekDays(reference);
  const make = (day: number, activity: Omit<Activity, 'id' | 'date'>): Activity => ({
    ...activity,
    id: `demo-${day}-${activity.startTime}`,
    date: toDateKey(week[day]),
  });

  return [
    make(1, {
      title: 'Soccer practice', startTime: '16:00', endTime: '17:15', child: 'Maya',
      location: 'Riverside Field', notes: 'Bring water and shin guards.', category: 'sports',
      color: 'coral', icon: '⚽',
    }),
    make(2, {
      title: 'Piano lesson', startTime: '15:30', endTime: '16:15', child: 'Leo',
      location: 'Music Room 2', notes: 'Practice the new scale.', category: 'music',
      color: 'violet', icon: '♫',
    }),
    make(3, {
      title: 'Library club', startTime: '16:30', endTime: '17:30', child: 'Maya',
      location: 'Oak Street Library', notes: 'Return last week’s book.', category: 'clubs',
      color: 'blue', icon: '📚',
    }),
    make(5, {
      title: 'Family bike ride', startTime: '10:00', endTime: '11:30', child: 'Everyone',
      location: 'Greenway Trail', notes: 'Helmets for everyone.', category: 'family',
      color: 'green', icon: '🚲',
    }),
  ];
}
