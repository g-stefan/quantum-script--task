# Queue model

This page explains how a `TaskQueue` works, so you can predict when your
functions run. The whole extension is about 130 lines of Quantum Script,
in `source/XYO/QuantumScript.Extension/Task/Library.js`.

## The queue

A `TaskQueue` holds one array of **entries**. An entry is a function with
no arguments that returns a true value to say "call me again" and a false
value to say "I am done".

- `add(fn)` appends `fn` itself as an entry.
- `setTimeout(fn, ms, ...)` appends an entry that checks the clock: before
  the due time it returns `true` (wait); at or after it, it calls
  `fn(...)` once and returns `false` (done).
- `setInterval(fn, ms, ...)` appends an entry that, each time it is due,
  sets the next due time to *now* + `ms`, calls `fn(...)` and returns
  `true` (keep going).

The due time of a timer is computed **when `setTimeout` / `setInterval`
is called**, with `DateTime.timestampInMilliseconds()`. Time spent before
`join()` counts: a 100 ms timeout set 500 ms before `join()` fires on the
first pass.

## The loop: `join()`

`join()` repeats **passes** over the queue until it is empty:

1. Call each entry in order, from the first to the last. An entry that
   returns a false value is marked done.
2. At the end of the pass, remove the done entries. If none are left,
   return.
3. Otherwise sleep with `CurrentThread.sleep(1)` and start the next pass.

So each entry is called **once per pass**. Entries added while `join()`
runs (a timeout set from a callback, a task added by a task) are appended
to the same array and are called later in the same pass.

Everything runs in the thread that called `join()`, one function at a
time. While one callback runs, nothing else does: a callback that takes
2 seconds delays every timer by 2 seconds. Keep callbacks short; move
heavy work to a `Thread` and wait for it with a polled task.

`join()` blocks the script until the queue is empty. Code after `join()`
runs after the last timer fired or was cleared. With an interval that is
never cleared, `join()` never returns.

## Timing and precision

Timers are checked **once per pass**, and a pass ends with
`CurrentThread.sleep(1)`. How long that sleep really takes depends on the
operating system:

| Platform | Typical pass length (empty or idle queue) | Effect |
|----------|-------------------------------------------|--------|
| Windows (default timer resolution) | about 15 ms | about 70 passes per second |
| Linux | about 1 ms | about 1000 passes per second |

Measured on Windows 11 with `quantum-script`:

| Request | Observed |
|---------|----------|
| `setTimeout(fn, 100)` | fires after about 110 ms |
| `setInterval(fn, 20)` | fires about every 31 ms |
| `add(fn)` returning `true` | called about 14 times in 200 ms |

Consequences:

- A timer fires at its due time **or later**, never earlier. Add up to one
  pass of delay, plus the time the other entries of the pass take.
- An interval **drifts**: the next due time is computed when the
  callback fires, not from the original schedule, so the period is `ms`
  plus the delay of each firing. Do not count ticks to measure time;
  read `DateTime.timestampInMilliseconds()` instead.
- A polled task (`add`) advances **one step per pass**. A task that does
  a tiny step and returns `true` progresses slowly on Windows (about 70
  steps per second). Do a meaningful amount of work in each step, or loop
  for a few milliseconds inside the step.
- `setTimeout(fn, 0)` and `setInterval(fn, 0)` are allowed: they fire on
  the next pass (an interval of 0 fires on every pass).

## Order

- Entries are called in the order they were added.
- Two timers due in the same pass fire in the order they were set, not in
  the order of their due times.
- A timer set from a callback is appended after the current entry; if it
  is already due (`ms` is 0), it fires later **in the same pass**.

## Ids

`setTimeout` and `setInterval` return an integer id from one counter per
queue: `1`, `2`, `3`, ... (timeouts and intervals share the counter, so a
timeout and an interval never have the same id). **An id is never
reused**, so an old id can never cancel a newer timer.

- Each queue keeps its active timers in two maps keyed by id,
  `q.timeout` and `q.interval`.
- `clearTimeout(id)` / `clearInterval(id)` remove the id from its map.
  The entry sees that on its next call and removes itself from the queue
  without calling `fn`. Clearing a timer and setting a new one right away
  is safe: the new timer gets a new id, and the old callback does not run.
- A timeout removes its id **before** calling `fn`; an interval keeps its
  id until it is cleared. Fired and cleared timers leave nothing behind,
  so a long running loop does not grow.
- `clearTimeout` only looks at timeouts and `clearInterval` only at
  intervals. Passing the id of the other kind, an id that already fired,
  or an unknown value does nothing.

## `this` and arguments

- Timer callbacks are called as `fn.apply(undefined, args)`: `this` is
  `undefined`. Use `fn.bind(object)` for methods.
- The extra arguments of `setTimeout(fn, ms, a, b, ...)` are stored when
  the timer is set and passed on every call (intervals get the **same**
  values each time). They are the same values, not copies: objects and
  arrays can be changed between the calls.
- A polled task (`add(fn)`) is called with no arguments and `this`
  `undefined`. Use a closure or `bind` for state.

## Errors

An exception thrown by a callback or a task is **not caught**: it leaves
`join()` and reaches your script. The queue keeps its state:

- The entry that threw is still in the queue and is the next one called by
  the next `join()`. A timeout has already removed its id, so it does
  **not** run again: the entry just removes itself. An interval waits for
  its next due time. A polled task (`add`) is called again.
- The other entries are untouched.

If you want the loop to survive errors, catch them inside the callback:

```javascript
Task.setInterval(function() {
	try {
		poll();
	} catch (e) {
		Console.writeLn("poll failed: " + e);
	};
}, 1000);
```

## Several queues

`Task` is one `TaskQueue` created when the extension loads, shared by the
whole script and every file it includes. `new TaskQueue()` creates an
independent queue with its own entries and ids; its `join()` runs only its
own entries. Use your own queue in a library, so that a caller's `join()`
does not run your timers and yours does not run theirs.

Do not call `join()` of a queue from inside one of its own callbacks: the
nested loop shares the pass position with the outer one. Calling `join()`
of a **different** queue from a callback works, but it blocks the outer
queue until the inner one is empty.

## Other limitations

- `TaskQueue` must be called with `new`; `TaskQueue()` alone throws.
- The queue is not thread safe. Use a queue only in the thread that
  created it. A `Thread` started with `Thread.newThread` has its own
  globals: it must call `Script.requireExtension("Task")` itself and gets
  its own `Task`.
