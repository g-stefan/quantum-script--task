---
name: quantum-script--task
description: >-
  How to use the Quantum Script Task extension (quantum-script--task), the
  timer and cooperative task extension loaded with
  Script.requireExtension("Task"): the global Task and new TaskQueue(),
  setTimeout(fn, ms, ...args) / clearTimeout(id), setInterval(fn, ms,
  ...args) / clearInterval(id), add(fn) polled tasks that run while they
  return true, and join(), the event loop that runs passes over the queue
  until it is empty (CurrentThread.sleep(1) between passes); the rules
  (nothing fires before join, join blocks until the queue is empty, an
  uncleared interval never ends, single thread, about 15 ms per pass on
  Windows, interval drift, unique never reused ids, this is undefined,
  exceptions leave join, TaskQueue needs new); waiting for a Thread with
  progress and
  time limits; the C++ registration (registerInternalExtension together
  with Thread and DateTime). Use when writing or reviewing Quantum Script
  or fabricare .js code that uses setTimeout, setInterval, Task.add,
  Task.join or TaskQueue, waits for a background Thread while timers run,
  C++ code that includes <XYO/QuantumScript.Extension/Task.hpp>, a
  fabricare.json depending on "quantum-script--task", or when working
  inside the quantum-script--task repository.
---

# quantum-script--task

This is the timer / event loop extension of Quantum Script. The rules of
the `quantum-script` skill (the language and its differences from
JavaScript) apply here too. Purpose: **give scripts `setTimeout` /
`setInterval` and polled tasks, and a loop (`join()`) that runs them**.
Use it to run something later or periodically, to wait for a `Thread`
while printing progress or enforcing a time limit, or to do a long job in
slices. It does **not** run anything in parallel: everything runs in the
thread that calls `join()`, one function at a time.

Full documentation lives in `docs/` of the quantum-script--task
repository (`X:\Storage\XYO\Gitea\CPP\quantum-script--task\docs` on this
machine):

- README: purpose, concepts, source map
- getting-started: build, first script, fabricare scripts, C++ host, static
- **queue-model**: passes, timing and precision, order, ids, errors,
  several queues, limitations
- **script-api**: the exact behavior of every function
- **recipes**: wait for a thread with progress, time limit, slices, steps,
  retry, restart a timer, bound methods, error tolerant loop (all tested)
- reference

Read the matching page when you need more than this summary. The whole
implementation is `source/XYO/QuantumScript.Extension/Task/Library.js`
(~130 lines of Quantum Script); read it when in doubt.

## Script API

```javascript
Script.requireExtension("Task");     // also loads Thread and DateTime; fabricare scripts have it already

var id = Task.setTimeout(fn, ms, a, b);   // fn(a, b) once, at the first pass >= now + ms; returns id 1, 2, ...
Task.clearTimeout(id);
var iv = Task.setInterval(fn, ms, a, b);  // first after ms, then ms after each call; returns interval id
Task.clearInterval(iv);                   // also from inside its own callback
Task.add(function() {                     // polled task: called once per pass
	return stillWorking;                  // true value: call again; false / no return: done
});
Task.join();                              // run passes until the queue is empty, then return

var q = new TaskQueue();                  // independent queue; `new` REQUIRED (TaskQueue() throws)
q.setTimeout(...); q.join();              // q.join() runs only q's entries
q.spin = function() { CurrentThread.sleep(10); };   // optional: the pause between passes
```

## Hard rules

1. **Nothing fires before `join()`.** Timers and tasks are queue entries;
   `join()` is the loop. Code after `join()` runs only when the queue is
   empty.
2. **`join()` blocks until the queue is empty.** An interval that is never
   cleared, or a task that always returns `true`, makes `join()` run
   forever. Every interval needs a `clearInterval` path.
3. **Single thread.** Callbacks run one at a time in the `join()` thread;
   a slow callback delays every timer. Put heavy work in a `Thread`
   (`quantum-script--thread`) and poll it with `Task.add(function() {
   return t.isRunning(); })`.
4. **Precision is one pass.** Each pass ends with `CurrentThread.sleep(1)`:
   about 15 ms on Windows, about 1 ms on Linux. A timer fires at or after
   its due time, never before. Measured on Windows: `setTimeout(f, 100)` →
   ~110 ms, `setInterval(f, 20)` → every ~31 ms.
5. **Intervals drift.** The next due time is set when the callback fires
   (now + `ms`). Measure time with `DateTime.timestampInMilliseconds()`,
   not by counting ticks.
6. **A polled task advances one step per pass** (~70 steps per second on
   Windows). Do a real amount of work per step.
7. **Due time is computed at `setTimeout` / `setInterval`**, not at
   `join()`. `ms` of 0 or less fires on the next pass.
8. **Ids** are `1`, `2`, ... from one counter per queue, shared by
   timeouts and intervals, and **never reused**. A stale id cannot cancel
   a newer timer, and `clearInterval(id); id = setInterval(f, ms);` is
   safe. `clearTimeout` ignores interval ids and `clearInterval` ignores
   timeout ids. Active timers live in `q.timeout` / `q.interval` (objects
   keyed by id) and are removed when they fire (timeouts) or are cleared.
9. **Clearing from inside a callback works**, including an interval
   clearing itself; the entry removes itself on its next call.
10. **`this` is `undefined`** in timer callbacks
    (`fn.apply(undefined, args)`) and in polled tasks. Use
    `fn.bind(object)` or closures. Extra arguments are stored once and
    passed (not copied) on every call.
11. **Exceptions leave `join()`.** The entry that threw stays in the queue
    and is called first on the next `join()`: a throwing timeout does not
    run again (its id is removed before the call), an interval waits for
    its next due time, a polled task is called again. Wrap callback bodies
    in `try` / `catch` when the loop must survive.
12. **Never call a queue's `join()` from its own callbacks**: the nested
    loop shares the pass position. Joining a different queue works but
    blocks the outer one until it is empty.
13. **`Task` is one global queue** shared with every included file. In a
    reusable library use `new TaskQueue()`.
14. **One queue per thread.** A `Thread` has empty globals: it calls
    `Script.requireExtension("Task")` and gets its own `Task`. Do not share
    a queue between threads.
15. Non-function callbacks are not checked at set time; they throw
    `functionApply` when they fire. `add(null)` / `add(0)` are skipped.

## Patterns

```javascript
// wait for a thread, show progress, enforce a limit
var progress = new Atomic(); progress.set(0);
var job = Thread.newThread(function(progress) {
	Script.requireExtension("Thread");                // fresh globals in the thread
	/* work, progress.set(n), check CurrentThread.isRequestToTerminate() */
	return "done";
}, null, [progress]);
var ticker = Task.setInterval(function() { Console.writeLn(progress.get() + "%"); }, 1000);
var limit = Task.setTimeout(function() { job.requestToTerminate(); }, 60000);
Task.add(function() {
	if (job.isRunning()) { return true; };
	Task.clearInterval(ticker); Task.clearTimeout(limit);
	result = job.getReturnedValue();
	return false;
});
Task.join();

// repeat N times: clear from inside the callback
var n = 0, id = Task.setInterval(function() { if (++n == 5) { Task.clearInterval(id); }; }, 100);

// steps with delays / retry: each call schedules the next
var step = function(k) { if (k < steps.length) { run(steps[k]); Task.setTimeout(step, 100, k + 1); }; };

// restart (debounce): clear + set is safe, ids are never reused
Task.clearTimeout(idle); idle = Task.setTimeout(onIdle, 200);
```

`docs/recipes.md` has complete, tested versions of these. For a pool of
jobs with a concurrency limit, use `quantum-script--job`; for parallel
work, `quantum-script--thread`.

## C++

```cpp
#include <XYO/QuantumScript.Extension/DateTime.hpp>
#include <XYO/QuantumScript.Extension/Thread.hpp>
#include <XYO/QuantumScript.Extension/Task.hpp>
using namespace XYO::QuantumScript;

void initExecutive(Executive *executive) {
	Extension::DateTime::registerInternalExtension(executive);   // Task's Library.js requires
	Extension::Thread::registerInternalExtension(executive);     // DateTime and Thread
	Extension::Task::registerInternalExtension(executive);
};
```

- There is no C++ API beyond `registerInternalExtension` /
  `initExecutive` and the metadata (`Copyright`, `License`, `Version`).
  `TaskQueue` is script code compiled by `initExecutive` with
  `executive->compileStringX(librarySource)`.
- Static build: `quantum-script--task.static` defines
  `XYO_QUANTUMSCRIPT_EXTENSION_TASK_LIBRARY` (empty export macro, no
  `quantumScriptExtension` entry point). Register it as internal, with
  `Thread` and `DateTime`.

## Working in this repository

- Build with `fabricare make`, `fabricare test` and `fabricare install` (see
  the `fabricare` skill). Install `quantum-script`,
  `quantum-script--console`, `quantum-script--thread` and
  `quantum-script--datetime` first. `test.01` is a C++ host with Console,
  DateTime, Thread and Task internal, run in `output/test`, that executes
  `../../test/test.01.js`.
- `TaskQueue` and `Task` are written in script in `Library.js`.
  `fabricare/make.prepare.js` (`file-to-cs`) turns it into
  `Library.Source.cpp` (`librarySource`), compiled in `initExecutive`.
  Edit `Library.js`, not the generated file.
- Quick check of a change without a C++ build: run a script with the
  installed `quantum-script` after `fabricare install`.
- When you change behavior, update `README.md`, `docs/script-api.md`,
  `docs/queue-model.md`, `docs/reference.md` and this skill.
- Code style: tabs (width 8), `.clang-format`, CRLF, statements and blocks
  end with `};`, camelCase. SPDX headers: MIT for `source/` and `docs/`,
  Unlicense for `test/`, `fabricare/` and `.claude/` (see `.reuse/dep5`).
