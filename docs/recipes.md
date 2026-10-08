# Recipes

Every recipe below is a complete script, tested with `quantum-script`.
Remember that nothing runs until `join()` is called, and that `join()`
returns only when the queue is empty (see [Queue model](queue-model.md)).

## Run something later

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

Task.setTimeout(function(who, what) {
	Console.writeLn(who + ": " + what);
}, 200, "build", "finished");

Console.writeLn("waiting...");
Task.join();
```

## Repeat N times

Stop an interval from inside its own callback.

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

var count = 0;
var id = Task.setInterval(function() {
	++count;
	Console.writeLn("tick " + count);
	if (count == 5) {
		Task.clearInterval(id);
	};
}, 100);

Task.join();
```

## Wait for a thread, show its progress

The heavy work runs in a `Thread`; the main thread stays free for timers.
A shared `Atomic` carries the progress, a polled task notices the end.

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

var progress = new Atomic();
progress.set(0);

var job = Thread.newThread(function(progress) {
	Script.requireExtension("Thread"); // a new thread starts with empty globals
	for (var i = 1; i <= 5; ++i) {
		CurrentThread.sleep(200);       // the real work
		progress.set(i * 20);
	};
	return "done";
}, null, [progress]);

var ticker = Task.setInterval(function() {
	Console.writeLn("progress: " + progress.get() + "%");
}, 300);

Task.add(function() {
	if (job.isRunning()) {
		return true;
	};
	Task.clearInterval(ticker);
	Console.writeLn("job: " + job.getReturnedValue());
	return false;
});

Task.join();
```

## Time limit for a thread

A timeout asks the thread to stop; the polled task cancels the timeout if
the thread finishes first.

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

var slow = Thread.newThread(function() {
	Script.requireExtension("Thread");
	while (!CurrentThread.isRequestToTerminate()) {
		CurrentThread.sleep(5); // one step of the work
	};
	return "stopped";
}, null, []);

var limit = Task.setTimeout(function() {
	Console.writeLn("time limit reached");
	slow.requestToTerminate();
}, 500);

Task.add(function() {
	if (slow.isRunning()) {
		return true;
	};
	Task.clearTimeout(limit);
	Console.writeLn("slow: " + slow.getReturnedValue());
	return false;
});

Task.join();
```

## Long job in slices

A polled task does one slice per pass and returns `true` until it is done,
so timers keep firing in between. Each task is called once per pass (about
every 15 ms on Windows), so make each slice a real amount of work.

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

var items = [];
for (var i = 0; i < 100000; ++i) {
	items[i] = i;
};

var index = 0;
var sum = 0;
Task.add(function() {
	var end = index + 10000;
	if (end > items.length) {
		end = items.length;
	};
	for (; index < end; ++index) {
		sum += items[index];
	};
	return index < items.length;
});

var status = Task.setInterval(function() {
	Console.writeLn("at " + index);
	if (index >= items.length) {
		Task.clearInterval(status);
	};
}, 50);

Task.join();
Console.writeLn("sum: " + sum);
```

## Steps with a delay between them

Each step schedules the next one.

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

var steps = ["stop service", "copy files", "start service"];

var runStep = function(k) {
	if (k >= steps.length) {
		return;
	};
	Console.writeLn("step: " + steps[k]);
	Task.setTimeout(runStep, 100, k + 1);
};

runStep(0);
Task.join();
```

## Retry with a delay

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

var attempt = 0;
function tryConnect() {
	++attempt;
	return attempt >= 3; // stands for the real operation
};

var retry = function(left) {
	if (tryConnect()) {
		Console.writeLn("connected after " + attempt + " attempts");
		return;
	};
	if (left <= 0) {
		Console.writeLn("giving up");
		return;
	};
	Console.writeLn("attempt " + attempt + " failed, retrying");
	Task.setTimeout(retry, 100, left - 1);
};

retry(5);
Task.join();
```

## Restart a timer

Clear the timer and set a new one. Ids are never reused, so the cleared
callback cannot run (see [Ids](queue-model.md#ids)). Here an idle timeout
is pushed back each time there is activity.

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

var idle = 0;
function touch() {
	Task.clearTimeout(idle);
	idle = Task.setTimeout(function() {
		Console.writeLn("idle for 200 ms");
	}, 200);
};

touch();
var activity = 0;
var busy = Task.setInterval(function() {
	Console.writeLn("activity " + (++activity));
	touch(); // the previous idle timeout is cancelled
	if (activity == 3) {
		Task.clearInterval(busy);
	};
}, 50);

Task.join(); // three activity lines, then "idle for 200 ms" once
```

## Methods as callbacks, own queue

Callbacks get `this` `undefined`: bind methods to their object. A library
uses its own `TaskQueue`, so that it does not mix its timers with the
global `Task`.

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

function Blinker(queue, times) {
	this.queue = queue;
	this.left = times;
	this.on = false;
	this.id = queue.setInterval(this.toggle.bind(this), 100);
};

Blinker.prototype.toggle = function() {
	this.on = !this.on;
	Console.writeLn(this.on ? "on" : "off");
	if (--this.left == 0) {
		this.queue.clearInterval(this.id);
	};
};

var queue = new TaskQueue();
var blinker = new Blinker(queue, 4);
queue.join();
```

## Keep the loop alive on errors

An exception in a callback leaves `join()`. Catch inside the callback when
the loop must go on.

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

var n = 0;
var id = Task.setInterval(function() {
	++n;
	try {
		if (n == 2) {
			throw "bad input";
		};
		Console.writeLn("poll " + n + " ok");
	} catch (e) {
		Console.writeLn("poll " + n + " failed: " + e);
	};
	if (n == 3) {
		Task.clearInterval(id);
	};
}, 50);

Task.join();
```
