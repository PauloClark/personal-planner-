import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
import assert from 'node:assert/strict';
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {exports, require: path => load(`lib/utils/${path.replace('./', '')}.ts`), Date, Intl});
  return exports;
}
const {occursOn, expandEvents, plannerDate} = load('lib/utils/recurrence.ts');
const event = {id:'one', event_date:'2026-09-26', title:'Practice', start_time:'18:00', recurrence:'weekly', recurrence_interval:1};
assert(occursOn(event, '2026-10-03'));
assert(!occursOn(event, '2026-09-25'));
assert(!occursOn(event, '2026-09-27'));
assert(!occursOn({...event, recurrence_interval:2}, '2026-10-03'));
assert(occursOn({...event, recurrence_interval:2}, '2026-10-10'));
assert(occursOn({...event, recurrence_end_date:'2026-10-03'}, '2026-10-03'));
assert(!occursOn({...event, recurrence_end_date:'2026-10-03'}, '2026-10-10'));
assert(!occursOn({...event, recurrence:'monthly', event_date:'2026-01-31'}, '2026-02-28'));
assert(occursOn({...event, recurrence:'monthly', event_date:'2026-01-31'}, '2026-03-31'));
assert(occursOn({...event, recurrence:'yearly', event_date:'2024-02-29'}, '2028-02-29'));
assert(!occursOn({...event, recurrence:'yearly', event_date:'2024-02-29'}, '2025-02-28'));
assert(occursOn({...event, recurrence:'daily', recurrence_interval:3}, '2026-09-29'));
assert(!occursOn({...event, recurrence:'none'}, '2026-10-03'));
assert(occursOn({...event, recurrence:undefined}, '2026-09-26'));
const expanded = expandEvents([event], '2026-10-01', '2026-10-31');
assert.equal(expanded.length, 5);
assert.equal(expanded[0].series_start_date, '2026-09-26');
assert.equal(event.event_date, '2026-09-26');
assert.throws(() => expandEvents([event], '2026-01-01', '2028-01-01'));
assert.equal(plannerDate(new Date('2026-09-27T16:00:00Z')), '2026-09-28');
console.log('Recurrence checks passed: intervals, inclusive end, month ends, leap years, range limits, and Manila midnight.');

const {getReminders} = load('lib/utils/reminders.ts');
const now = new Date('2026-09-28T09:50:00+08:00').getTime();
const reminderEvent = {...event, event_date:'2026-09-28', recurrence:'none', status:'upcoming', start_time:'10:00:00', reminder_minutes:10};
assert.equal(getReminders([reminderEvent], [], now)[0].urgent, true);
assert.equal(getReminders([reminderEvent], [], now - 1)[0].urgent, false);
assert.equal(getReminders([{...reminderEvent, status:'cancelled'}], [], now).length, 0);
assert.equal(getReminders([{...reminderEvent, reminder_minutes:null}], [], now).length, 0);
assert.equal(getReminders([reminderEvent], [], now + 2 * 3_600_000).length, 0);
assert.equal(getReminders([{...reminderEvent, recurrence:'daily'}], [], now).length, 8);
assert.equal(getReminders([{...reminderEvent, event_date:'2026-09-29', start_time:null, reminder_minutes:1440}], [], now)[0].urgent, true);
const pending = {id:'t1', title:'Deadline', status:'pending', due_date:'2026-09-27'};
assert.equal(getReminders([], [pending], now)[0].urgent, true);
assert.equal(getReminders([], [{...pending, status:'completed'}], now).length, 0);
assert.equal(getReminders([], [{...pending, due_date:null}], now).length, 0);
assert.equal(getReminders([], [{...pending, due_date:'2026-10-20'}], now).length, 0);
const {formatDate, formatTime} = load('lib/utils/date.ts');
for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Manila']) {
  process.env.TZ = timezone;
  assert.equal(formatDate('2026-09-28', {weekday:'long', month:'long', day:'numeric', year:'numeric'}).toUpperCase(), 'MONDAY, SEPTEMBER 28, 2026');
  assert.equal(formatTime('18:00:00'), '6:00 PM');
}
console.log('Reminder checks passed: due boundary, recurring reminders, all-day, cancelled/completed items, expiry, task deadlines, and timezone independence.');
