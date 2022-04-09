//
// Quantum Script Extension Task
//
// Copyright (c) 2020-2022 Grigore Stefan <g_stefan@yahoo.com>
// Created by Grigore Stefan <g_stefan@yahoo.com>
//
// MIT License (MIT) <http://opensource.org/licenses/MIT>
//

#ifndef QUANTUM_SCRIPT_EXTENSION_TASK_VERSION_HPP
#define QUANTUM_SCRIPT_EXTENSION_TASK_VERSION_HPP

#define QUANTUM_SCRIPT_EXTENSION_TASK_VERSION_ABCD 2,14,0,24
#define QUANTUM_SCRIPT_EXTENSION_TASK_VERSION_STR "2.14.0"
#define QUANTUM_SCRIPT_EXTENSION_TASK_VERSION_STR_BUILD "24"
#define QUANTUM_SCRIPT_EXTENSION_TASK_VERSION_STR_DATETIME "2022-04-04 01:44:56"

#ifndef XYO_RC

#	ifndef QUANTUM_SCRIPT_EXTENSION_TASK__EXPORT_HPP
#		include "quantum-script-extension-task--export.hpp"
#	endif

namespace Quantum {
	namespace Script {
		namespace Extension {
			namespace Task {
				namespace Version {
					QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT const char *version();
					QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT const char *build();
					QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT const char *versionWithBuild();
					QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT const char *datetime();
				};
			};
		};
	};
};

#endif
#endif
