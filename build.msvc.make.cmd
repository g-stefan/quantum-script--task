@echo off
rem Public domain
rem http://unlicense.org/
rem Created by Grigore Stefan <g_stefan@yahoo.com>

set ACTION=%1
if "%1" == "" set ACTION=make

echo -^> %ACTION% quantum-script-extension-task

goto StepX
:cmdX
%*
if errorlevel 1 goto cmdXError
goto :eof
:cmdXError
echo "Error: %ACTION%"
exit 1
:StepX

call :cmdX file-to-cs --touch=source/quantum-script-extension-task.cpp --file-in=source/quantum-script-extension-task.js --file-out=source/quantum-script-extension-task.src --is-string --name=extensionTaskSource
call :cmdX xyo-cc --mode=%ACTION% @util/quantum-script-extension-task.static.compile.info
call :cmdX xyo-cc --mode=%ACTION% @util/quantum-script-extension-task.dynamic.compile.info
