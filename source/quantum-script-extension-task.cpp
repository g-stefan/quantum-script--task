//
// Quantum Script Extension Task
//
// Copyright (c) 2020-2022 Grigore Stefan <g_stefan@yahoo.com>
// Created by Grigore Stefan <g_stefan@yahoo.com>
//
// MIT License (MIT) <http://opensource.org/licenses/MIT>
//

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "quantum-script-extension-task-license.hpp"
#include "quantum-script-extension-task.hpp"
#ifndef QUANTUM_SCRIPT_EXTENSION_TASK_NO_VERSION
#	include "quantum-script-extension-task-version.hpp"
#endif

#include "quantum-script-extension-task.src"

//#define QUANTUM_SCRIPT_VM_DEBUG_RUNTIME

namespace Quantum {
	namespace Script {
		namespace Extension {
			namespace Task {

				using namespace XYO;
				using namespace Quantum::Script;

				void registerInternalExtension(Executive *executive) {
					executive->registerInternalExtension("Task", initExecutive);
				};

				void initExecutive(Executive *executive, void *extensionId) {

					String info = "Task\r\n";
					info << License::shortContent();

					executive->setExtensionName(extensionId, "Task");
					executive->setExtensionInfo(extensionId, info);
#ifndef QUANTUM_SCRIPT_EXTENSION_TASK_NO_VERSION
					executive->setExtensionVersion(extensionId, Extension::Task::Version::versionWithBuild());
#endif
					executive->setExtensionPublic(extensionId, true);

					executive->compileStringX(extensionTaskSource);
				};

			};
		};
	};
};

#ifdef XYO_COMPILE_DYNAMIC_LIBRARY
extern "C" QUANTUM_SCRIPT_EXTENSION_TASK_EXPORT void quantumScriptExtension(Quantum::Script::Executive *executive, void *extensionId) {
	Quantum::Script::Extension::Task::initExecutive(executive, extensionId);
};
#endif
