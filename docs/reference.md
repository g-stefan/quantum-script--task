# API reference

## Script

These symbols are available after `Script.requireExtension("Task")`. The
extension also requires `Thread` and `DateTime`, so their symbols are
available too.

### Globals

| Symbol | Kind | Notes |
|--------|------|-------|
| `TaskQueue()` | constructor | `new TaskQueue()`: an empty, independent queue; without `new` it throws |
| `Task` | TaskQueue | created when the extension loads; shared by the whole script |

### TaskQueue methods

| Method | Returns | Behavior |
|--------|---------|----------|
| `q.setTimeout(fn, ms, ...args)` | Number (timeout id) | `fn.apply(undefined, args)` once, at the first pass at or after now + `ms` |
| `q.clearTimeout(id)` | `undefined` | cancels the timeout; safe on any value; ignores interval ids |
| `q.setInterval(fn, ms, ...args)` | Number (interval id) | `fn.apply(undefined, args)` at the first pass at or after now + `ms`, then `ms` after each call, until cleared |
| `q.clearInterval(id)` | `undefined` | stops the interval; safe on any value, also from its own callback; ignores timeout ids |
| `q.add(fn)` | `undefined` | calls `fn()` once per pass while it returns a true value; no id |
| `q.join()` | `undefined` | runs passes until the queue is empty; sleeps `CurrentThread.sleep(1)` between passes; exceptions from callbacks pass through |
| `q.spin()` | `undefined` | the pause between passes; may be replaced on your own queue |

### Rules in short

| Topic | Rule |
|-------|------|
| When things run | only inside `join()`, in the thread that calls it, one at a time |
| End of `join()` | when no timer or task is left; an uncleared interval never ends |
| Precision | at or after the due time; up to one pass late (about 15 ms on Windows, about 1 ms on Linux) |
| Interval period | `ms` plus the delay of each call; drifts |
| Order | entries in the order they were added, once per pass |
| Ids | `1`, `2`, ... from one counter per queue, shared by timeouts and intervals; never reused |
| Clear then set | safe: the new timer gets a new id, the cleared callback never runs |
| `this` in callbacks and tasks | `undefined`; use `bind` |
| Extra arguments | stored when the timer is set, same values on every call, not copied |
| Exceptions | leave `join()`; the entry stays and is called first on the next `join()`; a timeout that threw does not run again |
| Threads | a queue belongs to one thread; a new `Thread` requires `Task` again and gets its own `Task` |

## C++

Namespace `XYO::QuantumScript::Extension::Task`; export macro
`XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT` (empty with
`XYO_QUANTUMSCRIPT_EXTENSION_TASK_LIBRARY`).

| Symbol | Header | Notes |
|--------|--------|-------|
| `registerInternalExtension(Executive *)` | `Task.hpp` | registers `"Task"` as internal; also register `Thread` and `DateTime` |
| `initExecutive(Executive *, void *extensionId)` | `Task.hpp` | extension init, called by the engine: sets name / info / version, compiles `Library.js` |
| `quantumScriptExtension(Executive *, void *)` | DLL export | `extern "C"`, DLL builds only |
| `Copyright::copyright()`, `License::license()`, `Version::version()`, ... | `Task/Copyright.hpp`, `License.hpp`, `Version.hpp` | library metadata |

| Build project | Kind | Defines |
|---------------|------|---------|
| `quantum-script--task` | DLL / shared library | exports `quantumScriptExtension` |
| `quantum-script--task.static` | static library, static CRT | `XYO_QUANTUMSCRIPT_EXTENSION_TASK_LIBRARY` for users |

| Dependency | Why |
|------------|-----|
| `quantum-script` | the engine |
| `quantum-script--thread` | `CurrentThread.sleep` between passes |
| `quantum-script--datetime` | `DateTime.timestampInMilliseconds`, the timer clock |
| `quantum-script--console` | used by the test host |
