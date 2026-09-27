// Browser smoke test: isolated project copy and local fake Supabase; never accesses real user data.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'planner-v2-smoke-'));
const browserPath = process.env.PLANNER_TEST_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Manila', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const shift = days => new Date(new Date(`${today}T00:00:00Z`).getTime() + days * 86400000).toISOString().slice(0,10);
const user = {id:'11111111-1111-4111-8111-111111111111', email:'smoke@example.test', aud:'authenticated', role:'authenticated', app_metadata:{provider:'email'}, user_metadata:{}, created_at:new Date().toISOString()};
const common = {user_id:user.id, created_at:new Date().toISOString(), updated_at:new Date().toISOString(), description:'Test description', priority:'Medium'};
let events = [{...common,id:'weekly',title:'Basketball Practice', event_date:shift(-14),start_time:'18:00:00',end_time:'19:00:00',category:'Personal',location:'Sports Hall',status:'upcoming',recurrence:'weekly',recurrence_interval:1,recurrence_end_date:null,reminder_minutes:1440}, {...common,id:'work',title:'Team Review',event_date:today,start_time:'09:00:00',end_time:'10:00:00',category:'Work',location:'Office',status:'upcoming',recurrence:'none',recurrence_interval:1,recurrence_end_date:null,reminder_minutes:30}];
let tasks = [{...common,id:'task1',title:'Finish report',description:'Quarterly figures',due_date:today,status:'pending',priority:'High'}, {...common,id:'task2',title:'Old completed task',due_date:shift(-1),status:'completed'}];
const token = `${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')}.test-signature`;
const api = http.createServer(async (req,res) => {
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','*'); res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS'); res.setHeader('Content-Type','application/json');
  if (req.method === 'OPTIONS') {res.end(); return;}
  const url = new URL(req.url,'http://localhost');
  if (url.pathname === '/auth/v1/token') {res.end(JSON.stringify({access_token:token,refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user})); return;}
  if (url.pathname === '/auth/v1/user') {res.end(JSON.stringify(user)); return;}
  if (url.pathname === '/auth/v1/logout') {res.end('{}'); return;}
  const table = url.pathname.split('/').pop();
  if (table !== 'events' && table !== 'tasks') {res.statusCode=404; res.end('{}'); return;}
  let rows = table === 'events' ? events : tasks;
  if (req.method === 'GET') {res.end(JSON.stringify(rows)); return;}
  let raw=''; for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const id = url.searchParams.get('id')?.replace('eq.','');
  let row;
  if (req.method === 'POST') {row={...common,...body,id:`new-${Date.now()}`}; rows.push(row);}
  if (req.method === 'PATCH') {row=rows.find(item=>item.id===id); Object.assign(row,body);}
  if (req.method === 'DELETE') {row=rows.find(item=>item.id===id); rows=rows.filter(item=>item.id!==id);}
  if (table==='events') events=rows; else tasks=rows;
  res.end(JSON.stringify(row || {}));
});
await new Promise(resolve => api.listen(54329,'127.0.0.1',resolve));
for (const entry of ['app','components','lib','types','public','package.json','tsconfig.json','next.config.ts','postcss.config.mjs']) fs.cpSync(path.join(root,entry),path.join(temp,entry),{recursive:true});
fs.symlinkSync(path.join(root,'node_modules'),path.join(temp,'node_modules'),'junction');
const log = fs.openSync(path.join(temp,'next.log'),'w');
let server;
const testEnv = {...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'test-key'};
let chrome, socket;
const errors=[];
try {
  console.log('Building an isolated production app with the local mock backend...');
  await new Promise((resolve,reject) => { const build = spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:temp,windowsHide:true,env:testEnv,stdio:['ignore',log,log]}); build.on('error',reject); build.on('exit',code=>code===0?resolve():reject(new Error('Isolated build failed; see test logs.'))); });
  server = spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','--port','3107'],{cwd:temp,windowsHide:true,env:testEnv,stdio:['ignore',log,log]});
  for (let i=0;i<120;i++) {try {const response=await fetch('http://localhost:3107/login'); if(response.ok) break;} catch {} if(i===119) throw new Error('Next test server failed to start'); await wait(500);}
  chrome=spawn(browserPath,['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9229',`--user-data-dir=${path.join(temp,'chrome')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
  let pages;
  for (let i=0;i<50;i++) {try {pages=await (await fetch('http://127.0.0.1:9229/json')).json(); if(pages.some(page => page.type === 'page')) break;} catch {} await wait(200);}
  socket=new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  let serial=0; const pending=new Map();
  socket.addEventListener('message',({data})=>{const message=JSON.parse(data); if(message.id) {const item=pending.get(message.id); if(item) {pending.delete(message.id); if(message.error) item.reject(new Error(JSON.stringify(message.error))); else item.resolve(message.result);}} else if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text+': '+(message.params.exceptionDetails.exception?.description??'')); else if(message.method==='Runtime.consoleAPICalled' && message.params.type==='error') {errors.push(message.params.args.map(arg=>arg.value??arg.description).join(' '));console.log('Browser error stack:',JSON.stringify(message.params.stackTrace));}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial; pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description??'Browser evaluation failed');return result.result.value;};
  const until=async expression=>{for(let i=0;i<120;i++){try{if(await evaluate(`Boolean(${expression})`)) return;}catch{} await wait(250);}throw new Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText')}`);};
  const click=async expression=>{await evaluate(`(${expression}).click()`);await wait(150);};
  const button=text=>`Array.from(document.querySelectorAll('button')).find(el=>el.textContent.trim()===${JSON.stringify(text)})`;
  const fill=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);};
  const select=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait(100);};
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setTimezoneOverride',{timezoneId:'America/Los_Angeles'});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://localhost:3107/login'});
  await until("document.querySelector('input[name=email]') && Object.keys(document.querySelector('input[name=email]')).some(key => key.startsWith('__reactProps'))");
  await fill('input[name=email]','smoke@example.test');await fill('input[name=password]','test-password');await click(button('Sign in'));
  await until("document.body.innerText.includes('Your schedule')");
  assert(await evaluate("document.body.innerText.includes('Basketball Practice')"),'Recurring occurrence appears on dashboard');
  await click("document.querySelector('button[aria-label=\"Search events and tasks\"]')");
  await fill('input[type=search]','Sports Hall');await until("document.querySelector('dialog').innerText.includes('Basketball Practice')");
  await click("document.querySelector('.planner-result')");await until("document.querySelector('dialog').innerText.includes('entire series')");
  await click("document.querySelector('button[aria-label=\"Close dialog\"]')");
  await click("document.querySelector('.notification-bell')");await until("document.querySelector('dialog').innerText.includes('Finish report')");
  await click("document.querySelector('button[aria-label=\"Close dialog\"]')");
  await click("document.querySelector('a[href=\"/calendar\"]')");await until("document.querySelector('select[aria-label=\"Calendar view\"]')");
  await select('select[aria-label="Calendar view"]','week');assert.equal(await evaluate("document.querySelectorAll('.agenda-day').length"),7);
  await select('select[aria-label="Calendar view"]','day');assert.equal(await evaluate("document.querySelectorAll('.agenda-day').length"),1);
  assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.agenda-day .event-title')).map(el=>el.textContent)"),['Team Review','Basketball Practice']);
  await select('.v2-filters label:nth-child(2) select','Work');assert.equal(await evaluate("document.querySelectorAll('.agenda-day .calendar-event').length"),1);
  await click(button('Clear filters'));assert.equal(await evaluate("document.querySelectorAll('.agenda-day .calendar-event').length"),2);
  await select('.v2-filters label:nth-child(3) select','High');assert.equal(await evaluate("document.querySelectorAll('.agenda-day .calendar-event').length"),0);await click(button('Clear filters'));
  await select('.v2-filters label:nth-child(4) select','completed');assert.equal(await evaluate("document.querySelectorAll('.agenda-day .calendar-event').length"),0);await click(button('Clear filters'));
  await click(button('Add event'));await until("document.querySelector('input[name=title]')");
  await fill('input[name=title]','Browser recurring event');await select('select[name=recurrence]','daily');await fill('input[name=recurrence_interval]','2');await select('select[name=reminder_minutes]','30');await click(button('Save event'));
  await until("!document.querySelector('dialog')");assert.equal(events.find(event=>event.title==='Browser recurring event').recurrence_interval,2);assert.equal(events.filter(event=>event.title==='Browser recurring event').length,1);
  await click("Array.from(document.querySelectorAll('.calendar-event')).find(el=>el.textContent.includes('Basketball Practice'))");await click(button('Edit'));await until("document.querySelector('input[name=event_date]')");assert.equal(await evaluate("document.querySelector('input[name=event_date]').value"),shift(-14));await fill('input[name=title]','Basketball Practice updated');await click(button('Save event'));await until("!document.querySelector('dialog')");assert.equal(events.find(event=>event.id==='weekly').event_date,shift(-14));assert.equal(events.filter(event=>event.id==='weekly').length,1);
  await click("document.querySelector('a[href=\"/tasks\"]')");await until("document.querySelector('select[aria-label=\"Filter by due date\"]')");
  await select('select[aria-label="Filter by due date"]','today');assert.equal(await evaluate("document.querySelectorAll('.task-card').length"),1);
  await click(button('Clear filters'));assert.equal(await evaluate("document.querySelectorAll('.task-card').length"),2);
  await click("document.querySelector('button[aria-label=\"Search events and tasks\"]')");await fill('input[type=search]','Quarterly');await until("document.querySelector('dialog').innerText.includes('Finish report')");await click("document.querySelector('.planner-result')");await until("document.querySelector('input[name=title]')");await click(button('Cancel'));
  await click("document.querySelector('a[href=\"/calendar\"]')");await until("document.querySelector('select[aria-label=\"Calendar view\"]')");
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await select('select[aria-label="Calendar view"]','week');
  assert(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),'Mobile view has no horizontal page overflow');
  const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(temp,'mobile-calendar.png'),Buffer.from(screenshot.data,'base64'));
  await click("document.querySelector('.notification-bell')");assert(await evaluate("document.querySelector('dialog').getBoundingClientRect().width <= window.innerWidth"),'Mobile modal fits');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('Browser checks passed: login, dashboard recurrence, search, reminders, week/day, event sorting, category and due-date filters, recurring create/edit, mobile layout, and hydration across timezones.');
  console.log(`Artifacts: ${temp}`);
} finally {
  socket?.close();chrome?.kill();server?.kill();api.close();fs.closeSync(log);
  console.log(`Test logs: ${path.join(temp,'next.log')}`);
}
