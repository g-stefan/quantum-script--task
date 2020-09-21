#!/bin/sh
# Public domain
# http://unlicense.org/
# Created by Grigore Stefan <g_stefan@yahoo.com>

ACTION=$1
if [ "$ACTION" = "" ]; then
	ACTION=make
fi

echo "-> $ACTION quantum-script-extension-task"

cmdX(){
	if ! "$@" ; then
		echo "Error: $ACTION"
		exit 1
	fi
}

cmdX file-to-cs --touch=source/quantum-script-extension-task.cpp --file-in=source/quantum-script-extension-task.js --file-out=source/quantum-script-extension-task.src --is-string --name=extensionTaskSource
cmdX xyo-cc --mode=$ACTION @util/quantum-script-extension-task.static.compile
cmdX xyo-cc --mode=$ACTION @util/quantum-script-extension-task.dynamic.compile
