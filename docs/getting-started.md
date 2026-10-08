# Getting started

## 1. Build and install

The extension is built with [fabricare](https://github.com/g-stefan/fabricare),
the build tool used by all XYO C++ projects. First install `quantum-script`
and the extensions it needs to the SDK: `quantum-script--console`,
`quantum-script--thread` and `quantum-script--datetime`. Then, from the
repository root:

```bash
fabricare make       # build into output/ (make.prepare first turns Library.js into Library.Source.cpp)
fabricare test       # build and run test.01 (run make first)
fabricare install    # copy output/{bin,include,lib} to ~/.fabricare/<platform>
fabricare clean      # remove output/ and temp/
```

The build produces two libraries:

| Project                       | Kind                                | Use it when                                         |
|-------------------------------|-------------------------------------|-----------------------------------------------------|
| `quantum-script--task`        | DLL / shared library (`dll-or-lib`) | scripts run by `quantum-script`, or a host using the engine DLL |
| `quantum-script--task.static` | static library, static CRT          | self-contained hosts built with `quantum-script.static` |

After `fabricare install`, the SDK `bin` folder holds
`quantum-script--task.dll` (Windows) / `libquantum-script--task.so`
(Linux) next to `quantum-script.exe`. `Script.requireExtension("Task")`
finds it there.

## 2. A first script

```javascript
Script.requireExtension("Console");
Script.requireExtension("Task");

var count = 0;
var tick = Task.setInterval(function() {
	++count;
	Console.writeLn("tick " + count);
	if (count == 3) {
		Task.clearInterval(tick);
	};
}, 100);

Task.setTimeout(function(name) {
	Console.writeLn("hello " + name);
}, 150, "world");

Task.join(); // runs the timers; returns when nothing is left
Console.writeLn("done");
```

Run it with:

```bash
quantum-script first-task.js
```

```
tick 1
hello world
tick 2
tick 3
done
```

Two things differ from JavaScript in a browser or Node.js:

- **Nothing fires until you call `join()`.** The timers are entries in a
  queue; `Task.join()` is the loop that checks and calls them. Code after
  `join()` runs when the queue is empty.
- **`join()` returns only when the queue is empty.** An interval that is
  never cleared keeps `join()` running forever. Clear it from a callback,
  or from a timeout.

`Script.requireExtension("Task")` loads the extension once (a second call
does nothing). Its script library itself calls
`Script.requireExtension("Thread")` and `Script.requireExtension("DateTime")`,
so `Thread`, `CurrentThread`, `Atomic`, `Processor` and `DateTime` are
available afterwards too. A missing extension throws
`Unable to open "Task"` (or `"Thread"` / `"DateTime"` if those are
missing).

## 3. fabricare build scripts

`fabricare` registers `Task` as an internal extension and its library
already calls `Script.requireExtension("Task")`, so build scripts can use
`Task` and `TaskQueue` directly:

```javascript
// in a fabricare script: wait for a worker thread, print a dot every second
var worker = Thread.newThreadFromFile("test/worker.js", null, []);
var dots = Task.setInterval(function() {
	Console.write(".");
}, 1000);
Task.add(function() {
	if (worker.isRunning()) {
		return true;
	};
	Task.clearInterval(dots);
	return false;
});
Task.join();
```

`Task` is a global shared by everything in the script (including included
files). If a library you include also uses `Task`, its timers run in your
`join()` and yours run in its `join()`. Create your own
`new TaskQueue()` when you want a loop that runs only your entries.

## 4. Register it in a C++ host

A host that embeds Quantum Script registers the extension in its init
callback. The Task library requires `Thread` and `DateTime`, so register
those too (or ship their DLLs next to the host):

```cpp
#include <XYO/QuantumScript.hpp>
#include <XYO/QuantumScript.Extension/Console.hpp>
#include <XYO/QuantumScript.Extension/DateTime.hpp>
#include <XYO/QuantumScript.Extension/Thread.hpp>
#include <XYO/QuantumScript.Extension/Task.hpp>

using namespace XYO::QuantumScript;

void initExecutive(Executive *executive) {
	Extension::Console::registerInternalExtension(executive);
	Extension::DateTime::registerInternalExtension(executive);
	Extension::Thread::registerInternalExtension(executive);
	Extension::Task::registerInternalExtension(executive);
};

int main(int cmdN, char *cmdS[]) {
	if (ExecutiveX::initExecutive(cmdN, cmdS, initExecutive)) {
		if (!ExecutiveX::executeFile("script.js")) {
			printf("%s\n%s", ExecutiveX::getError().value(), ExecutiveX::getStackTrace().value());
		};
		ExecutiveX::endProcessing();
	};
	return 0;
};
```

Registering only makes the extension *available*. Scripts still call
`Script.requireExtension("Task")`. See `test/test.01.cpp`.

There is no C++ API beyond registration: `TaskQueue` is plain Quantum
Script, compiled into the executive by `initExecutive`. C++ code that wants
to schedule work can call the script functions, for example with
`ExecutiveX::executeString("Task.setTimeout(f, 100);")`.

In `fabricare.json`, depend on `quantum-script--task`:

```json
{
	"name" : "my-host",
	"make" : "exe",
	"dependency" : [
		"quantum-script--task"
	]
}
```

## 5. Static builds

Link `quantum-script--task.static` (it depends on `quantum-script.static`,
`quantum-script--console.static`, `quantum-script--thread.static` and
`quantum-script--datetime.static`). The static project defines
`XYO_QUANTUMSCRIPT_EXTENSION_TASK_LIBRARY`, which:

- makes `XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT` empty, and
- leaves out the `quantumScriptExtension` DLL entry point.

So in a static host the extension must be registered with
`Extension::Task::registerInternalExtension(executive)`, together with
`Thread` and `DateTime`; there is no library to load.
