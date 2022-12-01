// Quantum Script Extension Task
// Copyright (c) 2022 Grigore Stefan <g_stefan@yahoo.com>
// MIT License (MIT) <http://opensource.org/licenses/MIT>
// SPDX-FileCopyrightText: 2022 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: MIT

Script.requireExtension("Thread");
Script.requireExtension("DateTime");

function TaskQueue() {
	this.queue = [];
	this.queueIndex = 0;
	this.timeout = [];
	this.interval = [];

	this.getTimeoutFreeSlot = function() {
		for(var k = 0; k < this.timeout.length; ++k) {
			if(this.timeout[k]) {
				continue;
			};
			return k;
		};
		return this.timeout.length;
	};

	this.setTimeout = function(fn, milisec) {
		var fnTime = DateTime.timestampInMilliseconds() + milisec;
		var index = this.getTimeoutFreeSlot();

		var fnArgs = [];
		for(var k = 2; k < arguments.length; ++k) {
			fnArgs[k - 2] = arguments[k];
		};

		this.timeout[index] = true;
		this.queue[this.queue.length] = (function() {
			if(!this.timeout[index]) {
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

	this.clearTimeout = function(id) {
		this.timeout[id] = false;
	};

	this.getIntervalFreeSlot = function() {
		for(var k = 0; k < this.interval.length; ++k) {
			if(this.interval[k]) {
				continue;
			};
			return k;
		};
		return this.interval.length;
	};

	this.setInterval = function(fn, milisec) {
		var fnTime = DateTime.timestampInMilliseconds() + milisec;
		var index = this.getIntervalFreeSlot();

		var fnArgs = [];
		for(var k = 2; k < arguments.length; ++k) {
			fnArgs[k - 2] = arguments[k];
		};

		this.interval[index] = true;

		this.queue[this.queue.length] = (function() {
			if(!this.interval[index]) {
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

	this.clearInterval = function(id) {
		this.interval[id] = false;
	};

	this.spin = function() {
		CurrentThread.sleep(1);
	};

	this.join = function() {
		while(this.queue.length) {
			if(this.queueIndex >= this.queue.length) {
				this.queueIndex = 0;
				for(k = 0; k < this.queue.length;) {
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

