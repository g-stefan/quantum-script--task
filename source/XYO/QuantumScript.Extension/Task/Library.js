// Quantum Script Extension Task
// Copyright (c) 2016-2026 Grigore Stefan <g_stefan@yahoo.com>
// MIT License (MIT) <http://opensource.org/licenses/MIT>
// SPDX-FileCopyrightText: 2016-2026 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: MIT

Script.requireExtension("Thread");
Script.requireExtension("DateTime");

function TaskQueue() {
	this.queue = [];
	this.queueIndex = 0;
	// Active timers by id; an id is never reused, so a cleared timer cannot come back
	this.timeout = {};
	this.interval = {};
	this.nextId = 1;

	this.setTimeout = function(fn, milisec) {
		var fnTime = DateTime.timestampInMilliseconds() + milisec;
		var id = this.nextId;
		++this.nextId;

		var fnArgs = [];
		for(var k = 2; k < arguments.length; ++k) {
			fnArgs[k - 2] = arguments[k];
		};

		this.timeout[id] = true;
		this.queue[this.queue.length] = (function() {
			if(!this.timeout[id]) {
				return false;
			};
			if(DateTime.timestampInMilliseconds() < fnTime) {
				return true;
			};
			delete this.timeout[id];
			fn.apply(undefined, fnArgs);
			return false;
		}).bind(this);
		return id;
	};

	this.clearTimeout = function(id) {
		delete this.timeout[id];
	};

	this.setInterval = function(fn, milisec) {
		var fnTime = DateTime.timestampInMilliseconds() + milisec;
		var id = this.nextId;
		++this.nextId;

		var fnArgs = [];
		for(var k = 2; k < arguments.length; ++k) {
			fnArgs[k - 2] = arguments[k];
		};

		this.interval[id] = true;

		this.queue[this.queue.length] = (function() {
			if(!this.interval[id]) {
				return false;
			};
			if(DateTime.timestampInMilliseconds() < fnTime) {
				return true;
			};

			fnTime = DateTime.timestampInMilliseconds() + milisec;
			fn.apply(undefined, fnArgs);
			return true;
		}).bind(this);
		return id;
	};

	this.clearInterval = function(id) {
		delete this.interval[id];
	};

	this.spin = function() {
		CurrentThread.sleep(1);
	};

	this.join = function() {
		while(this.queue.length) {
			if(this.queueIndex >= this.queue.length) {
				this.queueIndex = 0;
				for(var k = 0; k < this.queue.length;) {
					if(!this.queue[k]) {
						delete this.queue[k];
						continue;
					};
					++k;
				};
				if(!this.queue.length) {
					break;
				};
				this.spin();
			};
			if(this.queue[this.queueIndex]) {
				if(!this.queue[this.queueIndex]()) {
					this.queue[this.queueIndex] = undefined;
				};
			};
			this.queueIndex++;
		};
	};

	this.add = function(fn) {
		this.queue[this.queue.length] = fn;
	};

	return this;
};

Task = new TaskQueue();

