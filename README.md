# Quantum Script Extension Task

Quantum Script extension
- Timers for scripts: `setTimeout`, `setInterval`, `clearTimeout`,
`clearInterval`, with the same arguments as in JavaScript.
- Polled tasks (`add`) that run step by step next to the timers: wait for a
background `Thread`, show progress, enforce a time limit, work in slices.
- `join()` is the event loop: it runs the queue in the calling thread until
nothing is left. A global queue `Task` is ready to use; `new TaskQueue()`
creates more.
- Windows and Linux, the same API.

```javascript
Script.requireExtension("Task");

TaskQueue();
Task;
Task.setTimeout(fn,milliseconds,...arguments);
Task.clearTimeout(id);
Task.setInterval(fn,milliseconds,...arguments);
Task.clearInterval(id);
Task.add(fn);
Task.join();
```

`TaskQueue` must be called with `new`: `var queue = new TaskQueue();`.

Built on `quantum-script`, `quantum-script--thread` and
`quantum-script--datetime`, part of the XYO C++ SDK.

## Documentation

- [Overview](docs/README.md) - purpose and design
- [Getting started](docs/getting-started.md) - build, a first script, fabricare scripts, register in a C++ host, static builds
- [Queue model](docs/queue-model.md) - how `join()` runs the queue, timing, order, ids, errors, limitations
- [Script API](docs/script-api.md) - every function: exact behavior, edge cases
- [Recipes](docs/recipes.md) - wait for a thread with progress, time limits, slices, steps, retries, safe cancel
- [API reference](docs/reference.md)

A Claude Code skill for this extension is in
[.claude/skills/quantum-script--task](.claude/skills/quantum-script--task/SKILL.md).

## License

Copyright (c) 2016-2026 Grigore Stefan
Licensed under the [MIT](LICENSE) license.
