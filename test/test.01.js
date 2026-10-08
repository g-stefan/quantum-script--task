// Created by Grigore Stefan <g_stefan@yahoo.com>
// Public domain (Unlicense) <http://unlicense.org>
// SPDX-FileCopyrightText: 2016-2026 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: Unlicense

Script.requireExtension("Console");
Script.requireExtension("Task");

function check(condition, message) {
	if(!condition) {
		throw(new Error("test failed: " + message));
	};
	Console.writeLn("ok: " + message);
};

function countKeys(object) {
	var count = 0;
	for(var key in object) {
		++count;
	};
	return count;
};

// timeout with arguments
function testTimeoutArguments() {
	var log = [];
	var queue = new TaskQueue();
	queue.setTimeout(function(a, b) {
		log[log.length] = a + b;
	}, 10, "x", "y");
	queue.join();
	check(log.join(",") == "xy", "timeout called once with its arguments");
};

// interval stopped from its own callback
function testIntervalSelfClear() {
	var count = 0;
	var queue = new TaskQueue();
	var id = queue.setInterval(function() {
		++count;
		if(count == 3) {
			queue.clearInterval(id);
		};
	}, 0);
	queue.join();
	check(count == 3, "interval cleared from its own callback");
};

// polled task runs while it returns true
function testTask() {
	var steps = 0;
	var queue = new TaskQueue();
	queue.add(function() {
		++steps;
		return steps < 4;
	});
	queue.join();
	check(steps == 4, "task called until it returns false");
};

// a cleared timeout does not come back when a new one is set
function testClearedTimeoutNotRevived() {
	var log = [];
	var queue = new TaskQueue();
	var a = queue.setTimeout(function() {
		log[log.length] = "old";
	}, 0);
	queue.clearTimeout(a);
	var b = queue.setTimeout(function() {
		log[log.length] = "new";
	}, 0);
	queue.join();
	check(a != b, "timeout ids are not reused");
	check(log.join(",") == "new", "cleared timeout not revived");
};

// a cleared interval does not come back when it is restarted
function testClearedIntervalNotRevived() {
	var log = [];
	var queue = new TaskQueue();
	var id = queue.setInterval(function() {
		log[log.length] = "old";
	}, 0);
	queue.clearInterval(id);
	id = queue.setInterval(function() {
		log[log.length] = "new";
		queue.clearInterval(id);
	}, 0);
	queue.join();
	check(log.join(",") == "new", "cleared interval not revived");
};

// timeout and interval ids are distinct, clearing the wrong kind does nothing
function testIdKinds() {
	var log = [];
	var queue = new TaskQueue();
	var timeoutId = queue.setTimeout(function() {
		log[log.length] = "timeout";
	}, 0);
	var intervalId = queue.setInterval(function() {
		log[log.length] = "interval";
		queue.clearInterval(intervalId);
	}, 0);
	check(timeoutId != intervalId, "timeout and interval ids differ");
	queue.clearInterval(timeoutId);
	queue.clearTimeout(intervalId);
	queue.join();
	check(log.join(",") == "timeout,interval", "clear of the other kind ignored");
};

// fired and cleared timers release their slots
function testSlotsReleased() {
	var queue = new TaskQueue();
	for(var i = 0; i < 100; ++i) {
		queue.setTimeout(function() {}, 0);
	};
	var cleared = queue.setTimeout(function() {}, 1000);
	queue.clearTimeout(cleared);
	var id = queue.setInterval(function() {
		queue.clearInterval(id);
	}, 0);
	queue.join();
	check(countKeys(queue.timeout) == 0, "no timeout slot left after join");
	check(countKeys(queue.interval) == 0, "no interval slot left after join");
	check(queue.queue.length == 0, "queue empty after join");
};

// join does not change a global k
function testGlobalK() {
	k = "mine";
	var queue = new TaskQueue();
	queue.add(function() {
		return false;
	});
	queue.setTimeout(function() {}, 0);
	queue.join();
	check(k == "mine", "global k kept by join");
};

// a timeout that throws leaves join and does not run again
function testThrowingTimeout() {
	var calls = 0;
	var queue = new TaskQueue();
	queue.setTimeout(function() {
		++calls;
		throw(new Error("expected"));
	}, 0);
	var thrown = false;
	try {
		queue.join();
	} catch(e) {
		thrown = true;
	};
	queue.join();
	check(thrown, "exception leaves join");
	check(calls == 1, "throwing timeout called once");
};

// the global queue
function testGlobalTask() {
	var fired = false;
	Task.setTimeout(function() {
		fired = true;
	}, 0);
	Task.join();
	check(fired, "global Task runs timers");
};

testTimeoutArguments();
testIntervalSelfClear();
testTask();
testClearedTimeoutNotRevived();
testClearedIntervalNotRevived();
testIdKinds();
testSlotsReleased();
testGlobalK();
testThrowingTimeout();
testGlobalTask();

Console.writeLn("all tests passed");
