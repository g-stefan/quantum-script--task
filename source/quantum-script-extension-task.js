//
// Quantum Script Extension Task
//
// Copyright (c) 2020-2022 Grigore Stefan <g_stefan@yahoo.com>
// Created by Grigore Stefan <g_stefan@yahoo.com>
//
// MIT License (MIT) <http://opensource.org/licenses/MIT>
//

Script.requireExtension("Thread");
Script.requireExtension("DateTime");

function TaskQueue() {
	.queue = [];
	.queueIndex = 0;
	.timeout = [];
	.interval = [];

	.getTimeoutFreeSlot = function() {
		for(var k = 0; k < .timeout.length; ++k) {
			if(.timeout[k]) {
				continue;
			};
			return k;
		};
		return .timeout.length;
	};

	.setTimeout = function(fn, milisec) {
		var fnTime = DateTime.timestampInMilliseconds() + milisec;
		var index = .getTimeoutFreeSlot();

		var fnArgs = [];
		for(var k = 2; k < arguments.length; ++k) {
			fnArgs[k - 2] = arguments[k];
		};

		.timeout[index] = true;
		.queue[.queue.length] = (function() {
			if(!.timeout[index]) {
				return false;
			};
			if(DateTime.timestampInMilliseconds() < fnTime) {
				return true;
			};
			fn.apply(undefined, fnArgs);
			return false;
		}).bind(this);
		return index;
	};

	.clearTimeout = function(id) {
		.timeout[id] = false;
	};

	.getIntervalFreeSlot = function() {
		for(var k = 0; k < .interval.length; ++k) {
			if(.interval[k]) {
				continue;
			};
			return k;
		};
		return .interval.length;
	};

	.setInterval = function(fn, milisec) {
		var fnTime = DateTime.timestampInMilliseconds() + milisec;
		var index = .getIntervalFreeSlot();

		var fnArgs = [];
		for(var k = 2; k < arguments.length; ++k) {
			fnArgs[k - 2] = arguments[k];
		};

		.interval[index] = true;

		.queue[.queue.length] = (function() {
			if(!.interval[index]) {
				return false;
			};
			if(DateTime.timestampInMilliseconds() < fnTime) {
				return true;
			};

			fnTime = DateTime.timestampInMilliseconds() + milisec;
			fn.apply(undefined, fnArgs);
			return true;
		}).bind(this);
		return index;
	};

	.clearInterval = function(id) {
		.interval[id] = false;
	};

	.spin = function() {
		CurrentThread.sleep(1);
	};

	.join = function() {
		while(.queue.length) {
			if(.queueIndex >= .queue.length) {
				.queueIndex = 0;
				for(k = 0; k < .queue.length;) {
					if(!.queue[k]) {
						delete .queue[k];
						continue;
					};
					++k;
				};
				if(!.queue.length) {
					break;
				};
				.spin();
			};
			if(.queue[.queueIndex]) {
				if(!.queue[.queueIndex]()) {
					.queue[.queueIndex] = undefined;
				};
			};
			.queueIndex++;
		};
	};

	.add = function(fn) {
		.queue[.queue.length] = fn;
	};

	return this;
};

Task = new TaskQueue();

