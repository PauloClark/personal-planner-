# Personal Planner

Next.js App Router, TypeScript, Supabase, and the existing responsive planner UI.

## Run locally

```powershell
npm install
npm run dev
```

Open http://localhost:3000. Create `.env.local` with your Supabase project values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

For a new database, run `supabase/schema.sql` in the Supabase SQL Editor. Existing databases should run **`supabase/migrations/20260928_planner_v2.sql`** before using Version 2. This migration adds columns to events, preserves existing rows, and leaves authentication and row-level security policies unchanged. Restart the dev server after changing environment variables.

## Version 2

- **Recurring events:** None, Daily, Weekly, Monthly, Yearly; interval 1–999 and optional inclusive end date. The event date anchors the weekday or day of month. A series uses one database row; occurrences are calculated only for the displayed range. Months without the original day are skipped (January 31 skips February; February 29 repeats only in leap years). Editing, completing, cancelling, or deleting applies to the entire series; individual occurrence exceptions are not included in V2.
- **Reminders:** None, 10/30 minutes, 1 hour, or 1 day before. The header bell shows event reminders for the next 7 days and pending task deadlines, including overdue tasks. Its badge counts currently due reminders/deadlines. Updates every 30 seconds and on window focus while the app is open. Timed reminders expire at the event's end, or one hour after its start if no end is set. All-day events start at midnight and reminders remain visible through that event day. No background delivery, browser push, SMS, or external paid service.
- **Calendar:** Existing month view, seven-day week agenda, and day agenda sorted by start time, with all-day events first. Use the view selector, date picker, Today, or previous/next controls. Category, priority, and status filters combine; Clear filters resets them. The dashboard keeps its compact month calendar, and its upcoming list includes occurrences over the next 90 days.
- **Global search:** Header search button searches event titles/descriptions/locations and task titles/descriptions. Results are labeled Event or Task and open the existing details/editor. Recurring series appear once in search.
- **Task filters:** Status, priority, due today, next seven days, past due date, no due date, or a specific date; Clear filters resets search and filters. The past-date filter can be combined with Pending to show overdue work.
- **Timezone:** Calendar dates, event times, reminders, and task deadlines use Asia/Manila, with explicit en-US display formatting. The server provides the initial clock value to avoid hydration differences.

## Checks and deployment

```powershell
node tests/planner-v2.mjs
npm run lint
npx tsc --noEmit
npm run build
npm start
```

The recurrence/reminder checks cover interval boundaries, inclusive end dates, month ends, leap years, bounded expansion, reminder timing/expiry, task deadlines, and timezone-independent formatting.

For Vercel, configure both environment variables, apply the SQL migration to the target Supabase project, and deploy using the existing Next.js configuration.

Optional browser smoke test (Chrome on Windows, no added npm dependencies):

```powershell
npm run test:browser
```

This builds an isolated temporary copy with a local mock Supabase API and checks login, calendar views, recurring event creation/editing, search, reminders, filters, and mobile layout. It never connects to the configured Supabase project. It uses local ports 3107, 54329, and 9229. Set `PLANNER_TEST_BROWSER` to another Chromium executable if needed. Logs and a mobile screenshot are saved in the temporary directory printed by the test. Real Supabase access policies and the migration must still be verified against your database.
