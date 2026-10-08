# Quantum Script Extension Task — Documentation

`quantum-script--task` is the **timer and cooperative task extension of
Quantum Script**. You load it with `Script.requireExtension("Task")`. It
gives scripts the JavaScript style `setTimeout` / `setInterval` functions
and a simple event loop to run them, plus polled tasks that run step by
step next to the timers. Windows and Linux use the same API.

Quantum Script has no built in event loop: a script runs from top to
bottom and ends. This extension adds one, written in Quantum Script:

- **A queue.** `TaskQueue` is a list of small functions. A global queue,
  `Task`, is created when the extension loads; you can create more with
  `new TaskQueue()`.
- **Timers.** `Task.setTimeout(fn, ms, ...)` calls `fn` once, `ms`
  milliseconds later. `Task.setInterval(fn, ms, ...)` calls it again every
  `ms` milliseconds. `clearTimeout(id)` / `clearInterval(id)` cancel them.
- **Polled tasks.** `Task.add(fn)` calls `fn` again and again while it
  returns a true value. Use it to wait for something (a thread, a file, a
  flag) or to do a long job in small slices.
- **The loop.** Nothing runs by itself. `Task.join()` runs the queue: it
  calls every entry in turn, sleeps 1 ms after each pass, and returns when
  the queue is empty.

Everything runs **in the thread that calls `join()`**, one function at a
time. There is no background thread and no parallelism: the extension is a
scheduler, not a thread pool. For real parallel work use the `Thread`
extension and use `Task` to wait for it without blocking your timers.

```
scripts: fabricare build scripts, quantum-script .js, tools
quantum-script--task    <-- this extension: TaskQueue, Task (setTimeout, setInterval, add, join)
quantum-script--thread                 (CurrentThread.sleep, used between passes)
quantum-script--datetime               (DateTime.timestampInMilliseconds, the timer clock)
quantum-script                         (Executive, ExecutiveX, Variable)
xyo-system, xyo-multithreading, xyo-encoding, xyo-data-structures, xyo-managed-memory, xyo-platform
```

## Why it exists

| Need | What the extension gives |
|------|--------------------------|
| Run something later, once | `Task.setTimeout(fn, ms, arg1, arg2, ...)` then `Task.join()` |
| Run something periodically (heartbeat, progress line, polling) | `Task.setInterval(fn, ms, ...)`, stop it with `Task.clearInterval(id)` |
| Wait for a background `Thread` while timers keep running | `Task.add(function() { return t.isRunning(); })` |
| Put a time limit on a job | a `setTimeout` that calls `requestToTerminate()` or sets a flag |
| Do a long job in slices, interleaved with other work | `Task.add(fn)` where `fn` does one slice and returns `true` until done |
| Port JavaScript code that uses `setTimeout` / `setInterval` | the same names and arguments, with an explicit `join()` |

## Concepts at a glance

| Need | Use | Notes |
|------|-----|-------|
| Load the extension | `Script.requireExtension("Task");` | also loads `Thread` and `DateTime`; fabricare scripts have it already |
| One shot timer | `var id = Task.setTimeout(fn, ms, a, b);` | `fn(a, b)` once; `this` is `undefined` |
| Repeating timer | `var id = Task.setInterval(fn, ms, a, b);` | first call after `ms`, then every `ms` after each call |
| Cancel | `Task.clearTimeout(id)`, `Task.clearInterval(id)` | ids are unique per queue and never reused |
| Polled task | `Task.add(fn)` | `fn()` called each pass while it returns a true value |
| Run the loop | `Task.join();` | blocks until the queue is empty; an uncleared interval keeps it running forever |
| Separate loop | `var q = new TaskQueue();` | `new` is required; `q.join()` runs only `q` |

## Contents

| Document | What it covers |
|----------|----------------|
| [Getting started](getting-started.md) | Build and install, a first script, fabricare scripts, register it in a C++ host, static builds |
| [Queue model](queue-model.md) | How `join()` runs the queue, timing and precision, order, ids, errors, limitations |
| [Script API](script-api.md) | Every function: arguments, exact behavior, edge cases, return values |
| [Recipes](recipes.md) | Wait for a thread with progress, time limits, work in slices, retries, sequences, safe cancel |
| [API reference](reference.md) | Every script and C++ symbol on one page |

Quantum Script itself (the language, `Script.requireExtension`, embedding)
is documented in the `quantum-script` repository, `docs/`. The `Thread`
and `DateTime` extensions have their own repositories and documentation.

## Source map

```
source/XYO/QuantumScript.Extension/Task.hpp            umbrella header (Library.hpp)
source/XYO/QuantumScript.Extension/Task.Amalgam.cpp    the whole extension in one translation unit
source/XYO/QuantumScript.Extension/Task/
    Dependency.hpp                 <XYO/QuantumScript.hpp>, export macro
    Library[.hpp/.cpp]             initExecutive (compiles Library.js), registerInternalExtension, DLL entry point
    Library.js                     TaskQueue and the global Task, written in Quantum Script
    Library.Source.cpp             Library.js as a C string (generated by fabricare/make.prepare.js)
    Copyright / License / Version  library metadata
fabricare/make.prepare.js          file-to-cs: Library.js -> Library.Source.cpp
test/test.01.cpp, test.01.js       C++ host with Console, DateTime, Thread and Task internal; loads Task
```

## AI assistant skill

A Claude Code skill describing how to use this extension lives in
[`.claude/skills/quantum-script--task/`](../.claude/skills/quantum-script--task/SKILL.md).
Claude Code loads it automatically inside this repository. To use it in the
projects that use `Task` (fabricare scripts, Quantum Script tools), copy
the folder to `~/.claude/skills/`.
