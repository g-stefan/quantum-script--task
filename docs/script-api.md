# Script API

This page lists everything the extension defines after
`Script.requireExtension("Task")`. All functions are methods of a
`TaskQueue` object: the global `Task`, or one you create with
`new TaskQueue()`. See [Queue model](queue-model.md) for how and when the
functions you give are called.

Loading `Task` also loads `Thread` (for `CurrentThread.sleep`) and
`DateTime` (for `DateTime.timestampInMilliseconds`), so those names are
defined afterwards too.

## Globals

### `TaskQueue()`

Constructor. `var q = new TaskQueue();` creates an empty, independent
queue. **`new` is required**: calling `TaskQueue()` without it throws
(`Error: setPropertyBySymbol`). Arguments are ignored. `typeof(q)` is
`"Object"`.

### `Task`

A `TaskQueue` created when the extension loads. It is a normal global
variable, shared by the whole script and every file it includes; fabricare
scripts have it already. Use it for scripts; prefer your own
`new TaskQueue()` in reusable libraries.

## Timers

### `q.setTimeout(fn, milliseconds, ...arguments)`

Schedules `fn` to be called **once**, `milliseconds` after now, with the
remaining arguments.

- `fn`: a function. It is called as `fn.apply(undefined, arguments)`, so
  `this` is `undefined`. It is not checked when the timer is set; a value
  that is not a function throws when the timer fires.
- `milliseconds`: a number. The due time is
  `DateTime.timestampInMilliseconds() + milliseconds`, computed now. `0`
  (or a negative number) means "on the next pass".
- `...arguments`: any values after the second one. They are kept as they
  are (not copied) and passed to `fn`.

Returns the timeout **id**, a Number (`1`, `2`, ...), unique in this
queue and never reused. Nothing happens until the queue's `join()`
runs; the callback fires during a pass at or after its due time.

```javascript
var id = Task.setTimeout(function(user, attempt) {
	Console.writeLn("retry " + attempt + " for " + user);
}, 500, "ana", 2);
```

### `q.clearTimeout(id)`

Cancels the timeout `id` of this queue: the callback is not called. Safe
on an id that already fired, an id cleared before, an interval id or an
unknown value (nothing happens). Returns `undefined`. Setting a new timeout
right after a clear is safe: it gets a new id (see [Ids](queue-model.md#ids)).

### `q.setInterval(fn, milliseconds, ...arguments)`

Schedules `fn` to be called **repeatedly**: the first time `milliseconds`
after now, then each time `milliseconds` after the previous call started.
Same arguments as `setTimeout`; the same argument values are passed on
every call.

Returns the interval **id**, a Number, unique in this queue (timeouts and
intervals share the counter) and never reused. An interval runs until
`clearInterval(id)` is called; until
then the queue is never empty and `join()` does not return.

```javascript
var seconds = 0;
var clock = Task.setInterval(function() {
	++seconds;
	if (seconds == 10) {
		Task.clearInterval(clock);
	};
}, 1000);
Task.join(); // about 10 seconds
```

The period is at least `milliseconds` and drifts by the loop delay of each
call (see [Timing](queue-model.md#timing-and-precision)).

### `q.clearInterval(id)`

Stops the interval `id` of this queue. Can be called from inside the
interval's own callback (the usual way to stop after N calls), from
another callback, or outside `join()`. Safe on an unknown or already
cleared id, or a timeout id (nothing happens). Returns `undefined`.
Restarting with `clearInterval(id); id = setInterval(...)` is safe.

## Tasks

### `q.add(fn)`

Appends `fn` to the queue as a **polled task**. On every pass of `join()`
it calls `fn()` (no arguments, `this` `undefined`):

- a true value (`true`, `1`, a non empty string, an object): keep the task,
  call it again on the next pass;
- a false value (`false`, `0`, `""`, `null`, `undefined`, no `return`):
  the task is done and is removed.

Returns `undefined`. There is no id and no way to cancel a task from
outside; let it return `false` (for example when a flag you own is set).

```javascript
// wait for a thread without blocking the timers
Task.add(function() {
	if (worker.isRunning()) {
		return true;
	};
	Console.writeLn("result: " + worker.getReturnedValue());
	return false;
});
```

`fn` is stored as given: adding something that is not a function throws
when `join()` calls it, and a false value (`null`, `0`) is skipped.

## The loop

### `q.join()`

Runs the queue until it is empty, then returns `undefined`.

- Each pass calls every entry once, in order, then sleeps
  `CurrentThread.sleep(1)`.
- Entries added during `join()` (by callbacks or tasks) run in the same
  `join()`.
- Returns at once if the queue is empty.
- An exception thrown by a callback leaves `join()` immediately. The entry
  that threw stays in the queue and is called first by the next `join()`:
  a timeout that threw does not run again, an interval waits for its next
  due time, a polled task is called again.
- Can be called again later, after more timers or tasks were added.

## Internal members

These are properties of each `TaskQueue`. They are public because the
queue is a plain script object, but they are implementation details; do
not change them.

| Member | Purpose |
|--------|---------|
| `q.queue` | Array of entries (functions); `undefined` marks a done entry until the end of the pass |
| `q.queueIndex` | position of the current pass |
| `q.timeout`, `q.interval` | Objects keyed by id: `true` while the timer is active, removed when it fires (timeout) or is cleared |
| `q.nextId` | the next id to give out |
| `q.spin()` | the pause between passes: `CurrentThread.sleep(1)` |

`spin` is the one member that is reasonable to replace, on your own queue,
to change the pause between passes:

```javascript
var q = new TaskQueue();
q.spin = function() {
	CurrentThread.sleep(10); // fewer passes, less CPU, coarser timers
};
```
