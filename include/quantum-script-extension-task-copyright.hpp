//
// Quantum Script Extension Task
//
// Copyright (c) 2020 Grigore Stefan <g_stefan@yahoo.com>
// Created by Grigore Stefan <g_stefan@yahoo.com>
//
// MIT License (MIT) <http://opensource.org/licenses/MIT>
//

#ifndef QUANTUM_SCRIPT_EXTENSION_TASK_COPYRIGHT_HPP
#define QUANTUM_SCRIPT_EXTENSION_TASK_COPYRIGHT_HPP

#define QUANTUM_SCRIPT_EXTENSION_TASK_COPYRIGHT            "Copyright (c) Grigore Stefan"
#define QUANTUM_SCRIPT_EXTENSION_TASK_PUBLISHER            "Grigore Stefan"
#define QUANTUM_SCRIPT_EXTENSION_TASK_COMPANY              QUANTUM_SCRIPT_EXTENSION_TASK_PUBLISHER
#define QUANTUM_SCRIPT_EXTENSION_TASK_CONTACT              "g_stefan@yahoo.com"
#define QUANTUM_SCRIPT_EXTENSION_TASK_FULL_COPYRIGHT       QUANTUM_SCRIPT_EXTENSION_TASK_COPYRIGHT " <" QUANTUM_SCRIPT_EXTENSION_TASK_CONTACT ">"

#ifndef XYO_RC

#ifndef QUANTUM_SCRIPT_EXTENSION_TASK__EXPORT_HPP
#include "quantum-script-extension-task--export.hpp"
#endif

namespace Quantum {
	namespace Script {
		namespace Extension {
			namespace Task {
				namespace Copyright {
					QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT const char *copyright();
					QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT const char *publisher();
					QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT const char *company();
					QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT const char *contact();
					QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT const char *fullCopyright();
				};
			};
		};
	};
};

#endif
#endif
