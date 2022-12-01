// Quantum Script Extension Task
// Copyright (c) 2022 Grigore Stefan <g_stefan@yahoo.com>
// MIT License (MIT) <http://opensource.org/licenses/MIT>
// SPDX-FileCopyrightText: 2022 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: MIT

#ifndef XYO_QUANTUMSCRIPT_EXTENSION_TASK_COPYRIGHT_HPP
#define XYO_QUANTUMSCRIPT_EXTENSION_TASK_COPYRIGHT_HPP

#ifndef XYO_QUANTUMSCRIPT_EXTENSION_TASK_DEPENDENCY_HPP
#	include <XYO/QuantumScript.Extension/Task/Dependency.hpp>
#endif

namespace XYO::QuantumScript::Extension::Task::Copyright {
	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT const char *copyright();
	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT const char *publisher();
	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT const char *company();
	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT const char *contact();
	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT const char *fullCopyright();
};

#endif
