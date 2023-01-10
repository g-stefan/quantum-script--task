// Quantum Script Extension Task
// Copyright (c) 2016-2023 Grigore Stefan <g_stefan@yahoo.com>
// MIT License (MIT) <http://opensource.org/licenses/MIT>
// SPDX-FileCopyrightText: 2016-2023 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: MIT

#ifndef XYO_QUANTUMSCRIPT_EXTENSION_TASK_LIBRARY_HPP
#define XYO_QUANTUMSCRIPT_EXTENSION_TASK_LIBRARY_HPP

#ifndef XYO_QUANTUMSCRIPT_EXTENSION_TASK_DEPENDENCY_HPP
#	include <XYO/QuantumScript.Extension/Task/Dependency.hpp>
#endif

namespace XYO::QuantumScript::Extension::Task {

	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT void initExecutive(Executive *executive, void *extensionId);
	XYO_QUANTUMSCRIPT_EXTENSION_TASK_EXPORT void registerInternalExtension(Executive *executive);

};

#endif
