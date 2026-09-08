'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  Download,
  FileUp,
  Filter,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  activityValidationErrors,
  addDays,
  addMonths,
  categoryOptions,
  childColorIndex,
  colorOptions,
  dateFromKey,
  formatTimeRange,
  getCategory,
  getMonthGridDays,
  getWeekDays,
  iconOptions,
  seedDemoActivities,
  sortActivities,
  toDateKey,
  type Activity,
  type ActivityCategory,
  type ActivityColor,
  type ActivityDraft,
  type ViewMode,
} from '@/lib/calendar';

const STORAGE_KEY = 'sunny-week.activities.v1';
const BACKUP_VERSION = 1;

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyDraft(date: string): ActivityDraft {
  return {
    title: '',
    date,
    startTime: '15:30',
    endTime: '16:30',
    child: '',
    location: '',
    notes: '',
    category: 'sports',
    color: 'coral',
    icon: '⚽',
  };
}

function periodTitle(anchor: Date, view: ViewMode) {
  if (view === 'month') {
    return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const days = getWeekDays(anchor);
  const start = days[0];
  const end = days[6];
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}–${end.getDate()}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Activity>;
  return Boolean(
    typeof item.title === 'string' &&
      typeof item.date === 'string' &&
      typeof item.startTime === 'string' &&
      typeof item.endTime === 'string' &&
      typeof item.child === 'string',
  );
}

function PlannerLoading() {
  return (
    <main className="planner-shell loading-shell">
      <output className="loading-card">
        <span className="brand-mark" aria-hidden="true"><Sparkles /></span>
        <div><strong>Sunny Week</strong><p>Getting your family calendar ready…</p></div>
      </output>
    </main>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const activitiesRef = useRef<Activity[]>([]);
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>('week');
  const [childFilter, setChildFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActivityDraft>(() => emptyDraft(''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Activity | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- browser storage is hydrated after the static shell mounts.
    setAnchor(new Date());
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        setActivities(Array.isArray(parsed) ? sortActivities(parsed.filter(isActivity)) : []);
      } else {
        setActivities(seedDemoActivities(new Date()));
      }
    } catch {
      setActivities(seedDemoActivities(new Date()));
      setNotice('Your saved plan could not be read, so we opened the sample week.');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    activitiesRef.current = activities;
    if (mounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities, mounted]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!mounted) return;
    type WebMcpRegistry = {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => unknown;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: WebMcpRegistry }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const reportError = (error: unknown) => console.warn('Sunny Week tool registration failed', error);

    try {
      void Promise.resolve(context.registerTool({
        name: 'create_activity',
        title: 'Create calendar activity',
        description: 'Add one child or family activity to the visible Sunny Week calendar.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' }, date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
            startTime: { type: 'string', description: '24-hour HH:MM time' },
            endTime: { type: 'string', description: '24-hour HH:MM time' }, child: { type: 'string' },
            location: { type: 'string' }, notes: { type: 'string' },
            category: { type: 'string', enum: categoryOptions.map((item) => item.value) },
          },
          required: ['title', 'date', 'startTime', 'endTime', 'child'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          const value = input as Partial<ActivityDraft>;
          const category = categoryOptions.find((item) => item.value === value.category) ?? categoryOptions.at(-1)!;
          const nextDraft: ActivityDraft = {
            title: String(value.title ?? ''), date: String(value.date ?? ''),
            startTime: String(value.startTime ?? ''), endTime: String(value.endTime ?? ''),
            child: String(value.child ?? ''), location: String(value.location ?? ''), notes: String(value.notes ?? ''),
            category: category.value, color: category.color, icon: category.icon,
          };
          const validation = activityValidationErrors(nextDraft);
          if (Object.keys(validation).length) throw new Error(Object.values(validation).join(' '));
          const activity = { ...nextDraft, id: newId() };
          setActivities((current) => sortActivities([...current, activity]));
          setAnchor(dateFromKey(activity.date));
          setNotice(`${activity.title} was added.`);
          return { id: activity.id, status: 'created', date: activity.date };
        },
      }, { signal: lifecycle.signal })).catch(reportError);

      void Promise.resolve(context.registerTool({
        name: 'list_activities',
        title: 'List calendar activities',
        description: 'Read the activities currently saved in Sunny Week.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute() {
          return { activities: activitiesRef.current };
        },
      }, { signal: lifecycle.signal })).catch(reportError);
    } catch (error) {
      reportError(error);
    }
    return () => lifecycle.abort();
  }, [mounted]);

  const children = useMemo(
    () => [...new Set(activities.map((activity) => activity.child).filter(Boolean))].sort(),
    [activities],
  );

  const filteredActivities = useMemo(
    () => activities.filter((activity) =>
      (childFilter === 'all' || activity.child === childFilter) &&
      (categoryFilter === 'all' || activity.category === categoryFilter),
    ),
    [activities, childFilter, categoryFilter],
  );

  const days = view === 'week' ? getWeekDays(anchor) : getMonthGridDays(anchor);
  const periodKeys = new Set(days.map(toDateKey));
  const periodActivities = filteredActivities.filter((activity) => periodKeys.has(activity.date));
  const title = periodTitle(anchor, view);

  function openCreate(date = toDateKey(anchor)) {
    setEditingId(null);
    setDraft(emptyDraft(date));
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(activity: Activity) {
    const { id, ...activityDraft } = activity;
    setEditingId(id);
    setDraft(activityDraft);
    setErrors({});
    setDialogOpen(true);
  }

  function saveActivity(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const validation = activityValidationErrors(draft);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    if (editingId) {
      setActivities((current) => sortActivities(current.map((item) =>
        item.id === editingId ? { ...draft, id: editingId } : item,
      )));
      setNotice(`${draft.title} was updated.`);
    } else {
      setActivities((current) => sortActivities([...current, { ...draft, id: newId() }]));
      setNotice(`${draft.title} was added.`);
    }
    setAnchor(dateFromKey(draft.date));
    setDialogOpen(false);
  }

  function duplicateActivity(activity: Activity) {
    setActivities((current) => sortActivities([...current, {
      ...activity,
      id: newId(),
      title: `${activity.title} copy`,
    }]));
    setNotice(`${activity.title} was duplicated.`);
  }

  function deleteActivity() {
    if (!pendingDelete) return;
    setActivities((current) => current.filter((item) => item.id !== pendingDelete.id));
    setNotice(`${pendingDelete.title} was removed.`);
    setPendingDelete(null);
  }

  function movePeriod(amount: number) {
    setAnchor((current) => view === 'week' ? addDays(current, amount * 7) : addMonths(current, amount));
  }

  function exportBackup() {
    const backup = JSON.stringify({ version: BACKUP_VERSION, exportedAt: new Date().toISOString(), activities }, null, 2);
    const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sunny-week-backup-${toDateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice('A backup was downloaded.');
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const source = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { activities?: unknown }).activities)
          ? (parsed as { activities: unknown[] }).activities
          : null;
      if (!source) throw new Error('not a backup');
      const imported = source.filter(isActivity).map((item) => {
        const category = categoryOptions.some((option) => option.value === item.category) ? item.category : 'other';
        const fallback = getCategory(category);
        return {
          ...item,
          id: typeof item.id === 'string' ? item.id : newId(),
          category,
          color: colorOptions.some((option) => option.value === item.color) ? item.color : fallback.color,
          icon: typeof item.icon === 'string' && item.icon ? item.icon : fallback.icon,
          location: typeof item.location === 'string' ? item.location : '',
          notes: typeof item.notes === 'string' ? item.notes : '',
        } satisfies Activity;
      });
      setActivities(sortActivities(imported));
      setNotice(`${imported.length} ${imported.length === 1 ? 'activity was' : 'activities were'} imported.`);
    } catch {
      setNotice('That file is not a valid Sunny Week backup.');
    }
  }

  function clearAll() {
    setActivities([]);
    setClearOpen(false);
    setNotice('The calendar is now clear.');
  }

  function printPlan() {
    window.setTimeout(() => window.print(), 50);
  }

  function changeCategory(value: ActivityCategory) {
    const category = getCategory(value);
    setDraft((current) => ({ ...current, category: value, icon: category.icon, color: category.color }));
  }

  if (!mounted) return <PlannerLoading />;

  return (
    <main className="planner-shell">
      <header className="topbar screen-only">
        <a className="brand" href="#main-calendar" aria-label="Sunny Week home">
          <span className="brand-mark" aria-hidden="true"><Sparkles /></span>
          <span><strong>Sunny Week</strong><small>Family activity planner</small></span>
        </a>
        <div className="header-actions">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="soft-button" aria-label="Calendar data options" />}>
              <Database /><span className="hide-tablet">Data</span><MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="data-menu">
              <DropdownMenuLabel>Calendar data</DropdownMenuLabel>
              <DropdownMenuItem onClick={exportBackup}><Download />Download backup</DropdownMenuItem>
              <DropdownMenuItem onClick={() => importInputRef.current?.click()}><FileUp />Import backup</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setClearOpen(true)}><Trash2 />Clear all activities</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input ref={importInputRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
          <Button variant="outline" className="soft-button" onClick={printPlan}><Printer /><span className="hide-mobile">Export PDF</span></Button>
          <Button className="add-button" onClick={() => openCreate()}><Plus />Add activity</Button>
        </div>
      </header>

      <section className="planner-content screen-only" id="main-calendar">
        <div className="intro-row">
          <div>
            <p className="eyebrow">Your family calendar</p>
            <h1>A happy week starts with a plan.</h1>
            <p className="intro-copy">Everything everyone needs to know, in one colorful place.</p>
          </div>
          <div className="child-legend" aria-label="Family members shown">
            {children.length ? children.map((child) => (
              <span key={child}><i className={`child-color-${childColorIndex(child)}`} />{child}</span>
            )) : <span><i className="child-color-0" />Your family</span>}
          </div>
        </div>

        <div className="calendar-toolbar">
          <div className="period-navigation">
            <Button variant="outline" size="icon" aria-label={`Previous ${view}`} onClick={() => movePeriod(-1)}><ChevronLeft /></Button>
            <Button variant="outline" size="icon" aria-label={`Next ${view}`} onClick={() => movePeriod(1)}><ChevronRight /></Button>
            <Button variant="ghost" className="today-button" onClick={() => setAnchor(new Date())}>Today</Button>
            <div className="period-copy"><h2>{title}</h2><p>{view === 'week' ? anchor.getFullYear() : `${periodActivities.length} planned`}</p></div>
          </div>
          <div className="toolbar-right">
            <div className="filters" aria-label="Calendar filters">
              <Filter aria-hidden="true" />
              <Label className="sr-only" htmlFor="child-filter">Filter by child</Label>
              <select id="child-filter" value={childFilter} onChange={(event) => setChildFilter(event.target.value)}>
                <option value="all">Everyone</option>
                {children.map((child) => <option value={child} key={child}>{child}</option>)}
              </select>
              <Label className="sr-only" htmlFor="category-filter">Filter by category</Label>
              <select id="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as ActivityCategory | 'all')}>
                <option value="all">All activities</option>
                {categoryOptions.map((category) => <option value={category.value} key={category.value}>{category.label}</option>)}
              </select>
            </div>
            <div className="view-controls" aria-label="Calendar view">
              <button className={view === 'week' ? 'active' : ''} type="button" onClick={() => setView('week')}>Week</button>
              <button className={view === 'month' ? 'active' : ''} type="button" onClick={() => setView('month')}>Month</button>
            </div>
          </div>
        </div>

        {view === 'week' ? (
          <WeekCalendar days={days} activities={periodActivities} onCreate={openCreate} onEdit={openEdit} onDuplicate={duplicateActivity} onDelete={setPendingDelete} />
        ) : (
          <MonthCalendar anchor={anchor} days={days} activities={periodActivities} onCreate={openCreate} onEdit={openEdit} />
        )}

        {!periodActivities.length && (
          <div className="empty-period">
            <span aria-hidden="true"><CalendarDays /></span>
            <div><strong>Nothing planned here yet.</strong><p>Add the first activity, or change the filters to see more.</p></div>
            <Button onClick={() => openCreate(view === 'week' ? toDateKey(days[0]) : toDateKey(anchor))}><Plus />Add an activity</Button>
          </div>
        )}

        <div className="tip-card">
          <span aria-hidden="true"><Check /></span>
          <p><strong>Make the plan theirs.</strong> Export this {view} as a kid-friendly PDF with a checkbox beside every activity.</p>
          <Button variant="ghost" onClick={printPlan}>Preview printout</Button>
        </div>
      </section>

      <PrintPlan view={view} title={title} days={days} activities={periodActivities} familyMembers={children} anchor={anchor} />

      <ActivityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={Boolean(editingId)}
        draft={draft}
        errors={errors}
        onDraftChange={setDraft}
        onCategoryChange={changeCategory}
        onSubmit={saveActivity}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this activity?</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete?.title} will be removed from the family calendar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteActivity}>Remove activity</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the whole calendar?</AlertDialogTitle>
            <AlertDialogDescription>This removes every saved activity from this browser. Download a backup first if you may need them later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={clearAll}>Yes, clear everything</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {notice && <output className="notice" aria-live="polite">{notice}</output>}
    </main>
  );
}

function ActivityCard({ activity, onEdit, onDuplicate, onDelete }: {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDuplicate: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}) {
  return (
    <article className={`activity-card color-${activity.color}`}>
      <button className="activity-card-main" type="button" onClick={() => onEdit(activity)} aria-label={`Edit ${activity.title}`}>
        <span className="activity-icon" aria-hidden="true">{activity.icon}</span>
        <span className="activity-title">{activity.title}</span>
        <span className="activity-detail"><Clock3 />{formatTimeRange(activity.startTime, activity.endTime)}</span>
        {activity.location && <span className="activity-detail"><MapPin />{activity.location}</span>}
        <span className={`child-pill child-bg-${childColorIndex(activity.child)}`}>{activity.child}</span>
      </button>
      <div className="activity-actions">
        <button type="button" onClick={() => onEdit(activity)} aria-label={`Edit ${activity.title}`}><Pencil /></button>
        <button type="button" onClick={() => onDuplicate(activity)} aria-label={`Duplicate ${activity.title}`}><Copy /></button>
        <button type="button" className="delete-action" onClick={() => onDelete(activity)} aria-label={`Delete ${activity.title}`}><Trash2 /></button>
      </div>
    </article>
  );
}

function WeekCalendar({ days, activities, onCreate, onEdit, onDuplicate, onDelete }: {
  days: Date[];
  activities: Activity[];
  onCreate: (date: string) => void;
  onEdit: (activity: Activity) => void;
  onDuplicate: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}) {
  const today = toDateKey(new Date());
  return (
    <div className="week-grid" aria-label="Weekly activity calendar">
      {days.map((day) => {
        const key = toDateKey(day);
        const dayActivities = activities.filter((activity) => activity.date === key);
        return (
          <section className={`day-column ${key === today ? 'today' : ''}`} key={key} aria-labelledby={`day-${key}`}>
            <header className="day-heading" id={`day-${key}`}>
              <span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <strong>{day.getDate()}</strong>
              {key === today && <small>Today</small>}
            </header>
            <div className="day-activities">
              {dayActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
              ))}
              <button className={dayActivities.length ? 'add-to-day' : 'empty-day'} type="button" onClick={() => onCreate(key)} aria-label={`Add an activity on ${day.toLocaleDateString('en-US', { weekday: 'long' })}`}>
                <Plus /><span>{dayActivities.length ? 'Add another' : 'Free day'}</span>
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MonthCalendar({ anchor, days, activities, onCreate, onEdit }: {
  anchor: Date;
  days: Date[];
  activities: Activity[];
  onCreate: (date: string) => void;
  onEdit: (activity: Activity) => void;
}) {
  const today = toDateKey(new Date());
  return (
    <div className="month-wrap">
      <div className="month-weekdays" aria-hidden="true">
        {getWeekDays(anchor).map((day) => <span key={day.getDay()}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>)}
      </div>
      <div className="month-grid" aria-label="Monthly activity calendar">
        {days.map((day) => {
          const key = toDateKey(day);
          const dayActivities = activities.filter((activity) => activity.date === key);
          const outside = day.getMonth() !== anchor.getMonth();
          return (
            <section className={`month-day ${outside ? 'outside' : ''} ${key === today ? 'today' : ''}`} key={key}>
              <button className="month-date" type="button" onClick={() => onCreate(key)} aria-label={`Add activity on ${day.toLocaleDateString('en-US', { dateStyle: 'full' })}`}>
                {day.getDate()}{key === today && <span>Today</span>}
              </button>
              <div className="month-activities">
                {dayActivities.slice(0, 3).map((activity) => (
                  <button className={`month-activity color-${activity.color}`} type="button" onClick={() => onEdit(activity)} key={activity.id}>
                    <span aria-hidden="true">{activity.icon}</span><strong>{formatTimeRange(activity.startTime, activity.endTime).split('–')[0]}</strong>{activity.title}
                  </button>
                ))}
                {dayActivities.length > 3 && <span className="more-count">+{dayActivities.length - 3} more</span>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ActivityDialog({ open, onOpenChange, editing, draft, errors, onDraftChange, onCategoryChange, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  draft: ActivityDraft;
  errors: Record<string, string>;
  onDraftChange: React.Dispatch<React.SetStateAction<ActivityDraft>>;
  onCategoryChange: (category: ActivityCategory) => void;
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}) {
  const update = <K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) =>
    onDraftChange((current) => ({ ...current, [key]: value }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="activity-dialog">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit activity' : 'Plan an activity'}</DialogTitle>
          <DialogDescription>Add the details the whole family needs.</DialogDescription>
        </DialogHeader>
        <form className="activity-form" onSubmit={onSubmit} noValidate>
          <div className="field-span-2">
            <Label htmlFor="activity-title">Activity name</Label>
            <Input id="activity-title" value={draft.title} onChange={(event) => update('title', event.target.value)} placeholder="Soccer practice" aria-invalid={Boolean(errors.title)} />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="activity-child">Child or family member</Label>
            <Input id="activity-child" value={draft.child} onChange={(event) => update('child', event.target.value)} placeholder="Maya" aria-invalid={Boolean(errors.child)} />
            {errors.child && <p className="field-error">{errors.child}</p>}
          </div>
          <div>
            <Label htmlFor="activity-date">Day</Label>
            <Input id="activity-date" type="date" value={draft.date} onChange={(event) => update('date', event.target.value)} aria-invalid={Boolean(errors.date)} />
            {errors.date && <p className="field-error">{errors.date}</p>}
          </div>
          <div>
            <Label htmlFor="activity-start">Starts</Label>
            <Input id="activity-start" type="time" value={draft.startTime} onChange={(event) => update('startTime', event.target.value)} aria-invalid={Boolean(errors.startTime)} />
          </div>
          <div>
            <Label htmlFor="activity-end">Ends</Label>
            <Input id="activity-end" type="time" value={draft.endTime} onChange={(event) => update('endTime', event.target.value)} aria-invalid={Boolean(errors.endTime)} />
            {errors.endTime && <p className="field-error">{errors.endTime}</p>}
          </div>
          <div>
            <Label htmlFor="activity-category">Category</Label>
            <select className="form-select" id="activity-category" value={draft.category} onChange={(event) => onCategoryChange(event.target.value as ActivityCategory)}>
              {categoryOptions.map((category) => <option value={category.value} key={category.value}>{category.icon} {category.label}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="activity-icon">Picture</Label>
            <select className="form-select icon-select" id="activity-icon" value={draft.icon} onChange={(event) => update('icon', event.target.value)}>
              {iconOptions.map((icon) => <option value={icon} key={icon}>{icon}</option>)}
            </select>
          </div>
          <fieldset className="field-span-2 color-field">
            <legend>Activity color</legend>
            <div className="color-options">
              {colorOptions.map((color) => (
                <button type="button" key={color.value} className={`color-swatch color-${color.value} ${draft.color === color.value ? 'selected' : ''}`} onClick={() => update('color', color.value as ActivityColor)} aria-label={color.label} aria-pressed={draft.color === color.value}>
                  {draft.color === color.value && <Check />}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="field-span-2">
            <Label htmlFor="activity-location">Location <span className="optional">Optional</span></Label>
            <Input id="activity-location" value={draft.location} onChange={(event) => update('location', event.target.value)} placeholder="Riverside Field" />
          </div>
          <div className="field-span-2">
            <Label htmlFor="activity-notes">Notes <span className="optional">Optional</span></Label>
            <Textarea id="activity-notes" value={draft.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Bring water and shin guards." rows={2} />
          </div>
          <DialogFooter className="field-span-2 form-footer">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Add to calendar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PrintActivity({ activity, compact = false }: { activity: Activity; compact?: boolean }) {
  return (
    <div className={`print-activity color-${activity.color} ${compact ? 'compact' : ''}`}>
      <span className="print-check" aria-hidden="true" />
      <span className="print-icon" aria-hidden="true">{activity.icon}</span>
      <div>
        <strong>{activity.title}</strong>
        <p>{formatTimeRange(activity.startTime, activity.endTime)} · {activity.child}</p>
        {!compact && activity.location && <p>{activity.location}</p>}
        {!compact && activity.notes && <small>{activity.notes}</small>}
      </div>
    </div>
  );
}

function PrintPlan({ view, title, days, activities, familyMembers, anchor }: {
  view: ViewMode;
  title: string;
  days: Date[];
  activities: Activity[];
  familyMembers: string[];
  anchor: Date;
}) {
  return (
    <section className="print-sheet" aria-hidden="true">
      <header className="print-header">
        <div><span className="print-sun">☀</span><div><h1>Sunny Week</h1><p>{view === 'week' ? 'My weekly plan' : 'My monthly plan'}</p></div></div>
        <div className="print-period"><strong>{title}</strong><span>{familyMembers.length ? familyMembers.join(' · ') : 'Our family plan'}</span></div>
      </header>
      {view === 'week' ? (
        <div className="print-week-grid">
          {days.map((day) => {
            const key = toDateKey(day);
            const dayActivities = activities.filter((activity) => activity.date === key);
            return (
              <section className="print-day" key={key}>
                <h2>{day.toLocaleDateString('en-US', { weekday: 'long' })}<span>{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></h2>
                <div>{dayActivities.length ? dayActivities.map((activity) => <PrintActivity activity={activity} key={activity.id} />) : <p className="print-free">Free day — enjoy!</p>}</div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="print-month">
          <div className="print-month-weekdays">{getWeekDays(anchor).map((day) => <strong key={day.getDay()}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</strong>)}</div>
          <div className="print-month-grid">
            {days.map((day) => {
              const key = toDateKey(day);
              const dayActivities = activities.filter((activity) => activity.date === key);
              return <section className={day.getMonth() !== anchor.getMonth() ? 'outside' : ''} key={key}><h2>{day.getDate()}</h2>{dayActivities.map((activity) => <PrintActivity compact activity={activity} key={activity.id} />)}</section>;
            })}
          </div>
        </div>
      )}
      <footer className="print-footer">One thing at a time. You’ve got this! <span>□ Pack my things &nbsp; □ Check the time &nbsp; □ Have fun</span></footer>
    </section>
  );
}
