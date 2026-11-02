/* =====================================================================
   SUNDIAL LITE: one list per day.
   Every function is small, does ONE job, and is numbered in the order
   you should build it. Build and test them one at a time.

   Only ONE kind of record exists:
     task = { id, title, done, date }
       id    : unique text, e.g. "t_k3j2h1"
       title : what the user typed
       done  : true or false
       date  : the day it belongs to, "YYYY-MM-DD"

   "Daily reset" = no deleting. Each task remembers its date, and we only
   SHOW tasks whose date is today. A new day therefore starts empty.
   ===================================================================== */


/* ---------------------------------------------------------------------
   PART A: DATABASE (4 functions). The ONLY part that touches storage.
   When you move to Inhouz, replace the inside of these four and nothing
   else in the file needs to change.
   --------------------------------------------------------------------- */

// 1. Get every task ever saved.            returns: list of tasks
async function dbGetAll() {
  const text = localStorage.getItem('tasks');
  return text ? JSON.parse(text) : [];
}

// 2. Save a new task.                      input: a task object
async function dbInsert(task) {
  const all = await dbGetAll();
  all.push(task);
  localStorage.setItem('tasks', JSON.stringify(all));
}

// 3. Change one task.                      input: id, {field: newValue}
async function dbUpdate(id, changes) {
  const all = await dbGetAll();
  const task = all.find(t => t.id === id);
  if (task) Object.assign(task, changes);
  localStorage.setItem('tasks', JSON.stringify(all));
}

// 4. Delete one task.                      input: id
async function dbDelete(id) {
  const all = await dbGetAll();
  const rest = all.filter(t => t.id !== id);
  localStorage.setItem('tasks', JSON.stringify(rest));
}


/* ---------------------------------------------------------------------
   PART B: LOGIC (no screen code, no storage code)
   --------------------------------------------------------------------- */

// 5. Today's date as text, e.g. "2026-10-28"  (uses the user's local day)
function getToday() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + month + '-' + day;
}

// 6. Only today's tasks.                   returns: list of tasks
async function loadTodayTasks() {
  const all = await dbGetAll();
  const today = getToday();
  return all.filter(t => t.date === today);
}

// 7. Add a task for today.                 input: text typed by the user
async function addTask(title) {
  title = title.trim();
  if (title === '') return;                       // ignore empty
  await dbInsert({
    id: 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: title,
    done: false,
    date: getToday()
  });
}

// 8. Tick or untick a task.                input: id
async function toggleTask(id) {
  const all = await dbGetAll();
  const task = all.find(t => t.id === id);
  if (!task) return;
  await dbUpdate(id, { done: !task.done });
}

// 9. Remove a task.                        input: id
async function removeTask(id) {
  await dbDelete(id);
}

// 10. Count progress.                      input: list of tasks
//     returns: { total, done, percent }
function countProgress(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total: total, done: done, percent: percent };
}

// 11. Greeting by hour.                    returns: text
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}


/* ---------------------------------------------------------------------
   PART C: SCREEN (reads the data, writes to the page)
   --------------------------------------------------------------------- */

// 12. Draw everything. Call this after EVERY change.
async function showPage() {
  const tasks = await loadTodayTasks();
  const p = countProgress(tasks);

  // header
  document.getElementById('dateText').textContent =
    new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('greetingText').textContent = getGreeting();

  // progress: bar width + colour (blue at 0% turns to warm gold at 100%)
  const bar = document.getElementById('progressBar');
  bar.style.width = p.percent + '%';
  bar.style.background = 'hsl(' + (215 - p.percent * 1.8) + ', 60%, 48%)';
  document.getElementById('progressText').textContent =
    p.total === 0 ? 'Nothing planned yet' : p.done + ' of ' + p.total + ' done (' + p.percent + '%)';

  // messages
  document.getElementById('emptyText').hidden = p.total !== 0;
  document.getElementById('allDoneText').hidden = !(p.total > 0 && p.done === p.total);

  // list
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  tasks.forEach(function (t) {
    const li = document.createElement('li');
    li.className = 'task' + (t.done ? ' done' : '');
    li.innerHTML =
      '<button class="box" data-action="toggle" data-id="' + t.id + '" aria-label="Mark done">' + (t.done ? '✓' : '') + '</button>' +
      '<span class="text"></span>' +
      '<button class="remove" data-action="remove" data-id="' + t.id + '" aria-label="Delete">×</button>';
    li.querySelector('.text').textContent = t.title;   // textContent keeps typed text safe
    list.appendChild(li);
  });
}


/* ---------------------------------------------------------------------
   PART D: EVENTS (what happens when the user does something)
   --------------------------------------------------------------------- */

// 13. User presses Add (or Enter)
document.getElementById('addForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const input = document.getElementById('taskInput');
  await addTask(input.value);
  input.value = '';
  await showPage();
  input.focus();
});

// 14. User clicks a circle or an ×
document.getElementById('taskList').addEventListener('click', async function (e) {
  const button = e.target.closest('button');
  if (!button) return;
  if (button.dataset.action === 'toggle') await toggleTask(button.dataset.id);
  if (button.dataset.action === 'remove') await removeTask(button.dataset.id);
  await showPage();
});

// 15. Page opens
showPage();

// Optional: if the page stays open past midnight, switch to the new day.
let lastDay = getToday();
setInterval(function () {
  if (getToday() !== lastDay) { lastDay = getToday(); showPage(); }
}, 60000);