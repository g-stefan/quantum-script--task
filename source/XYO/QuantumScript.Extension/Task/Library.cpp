// Quantum Script Extension Task
// Copyright (c) 2022 Grigore Stefan <g_stefan@yahoo.com>
// MIT License (MIT) <http://opensource.org/licenses/MIT>
// SPDX-FileCopyrightText: 2022 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: MIT

#include <XYO/QuantumScript.Extension/Task/Library.hpp>
#include <XYO/QuantumScript.Extension/Task/Copyright.hpp>
#include <XYO/QuantumScript.Extension/Task/License.hpp>
#include <XYO/QuantumScript.Extension/Task/Version.hpp>

#include <XYO/QuantumScript.Extension/Task/Library.Source.cpp>

namespace XYO::QuantumScript::Extension::Task {

	void registerInternalExtension(Executive *executive) {
		executive->registerInternalExtension("Task", initExecutive);
	};

	void initExecutive(Executive *executive, void *extensionId) {

		String info = "Task\r\n";
		info << License::shortLicense();

		executive->setExtensionName(extensionId, "Task");
		executive->setExtensionInfo(extensionId, info);
		executive->setExtensionVersion(extensionId, Extension::Task::Version::versionWithBuild());
		executive->setExtensionPublic(extensionId, true);

		executive->compileStringX(librarySource);
	};

};

#ifdef XYO_COMPILE_DYNAMIC_LIBRARY
extern "C" void quantumScriptExtension(XYO::QuantumScript::Executive *executive, void *extensionId) {
	XYO::QuantumScript::Extension::Task::initExecutive(executive, extensionId);
};
#endif
