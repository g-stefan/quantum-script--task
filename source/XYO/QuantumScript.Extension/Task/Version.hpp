// Quantum Script Extension Task
// Copyright (c) 2016-2025 Grigore Stefan <g_stefan@yahoo.com>
// MIT License (MIT) <http://opensource.org/licenses/MIT>
// SPDX-FileCopyrightText: 2016-2025 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: MIT

#ifndef XYO_QUANTUMSCRIPT_EXTENSION_TASK_VERSION_HPP
#define XYO_QUANTUMSCRIPT_EXTENSION_TASK_VERSION_HPP

#ifndef XYO_QUANTUMSCRIPT_EXTENSION_TASK_DEPENDENCY_HPP
#	include <XYO/QuantumScript.Extension/Task/Dependency.hpp>
#endif

namespace XYO::QuantumScript::Extension::Task::Version {

	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT const char *version();
	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT const char *build();
	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT const char *versionWithBuild();
	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT const char *datetime();

};

#endif
