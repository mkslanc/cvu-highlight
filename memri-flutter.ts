"use strict";

import ace from "ace-builds";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-error_marker";
import "ace-builds/src-noconflict/ext-options";
import "ace-builds/src-noconflict/ext-prompt";
import "ace-builds/src-noconflict/theme-dracula";
import {Mode} from "./playground/cvu-mode";
// @ts-ignore
import * as css from "./playground/memri-theme.css";

var Editor = ace.require("ace/editor").Editor;
var Renderer = ace.require("ace/virtual_renderer").VirtualRenderer;
var theme = ace.require("ace/theme/dracula");


var cvumode = new Mode()

var {HashHandler} = ace.require("ace/keyboard/hash_handler");
var event = ace.require("ace/lib/event");
var keyUtil = ace.require("ace/lib/keys");

var menuKb = new HashHandler([
    {
        bindKey: {win: "F1|Ctrl-Shift-P", mac: "F1|Cmd-Shift-P"},
        name: "commandPrompt",
        exec: function () {
        }
    },
    {
        bindKey: {win: "Ctrl-S", mac: "Cmd-S"},
        name: "Save",
        exec: function () {
            sendResult();
        }
    },
    {
        name: "autoindent",
        description: "Auto Indent",
        bindKey: {win: "Ctrl-Shift-F", mac: "Cmd-Shift-F"},
        exec: function () {
            editor.autoIndent();
        },
        multiSelectAction: "forEachLine",
        scrollIntoView: "animate"
    }
]);

event.addCommandKeyListener(window, function (e, hashId, keyCode) {
    var keyString = keyUtil.keyCodeToString(keyCode);
    var command = menuKb.findKeyCommand(hashId, keyString);
    if (command) {
        event.stopEvent(e);
        command.exec();
    }
});

var editor = new Editor(new Renderer(null, theme));
editor.setTheme({cssText: css, cssClass: "ace-memri", isDark: true})
var session = ace.createEditSession("", cvumode);
editor.setSession(session);

document.body.innerHTML = ""
editor.$options.readOnly.set.call(editor, editor.$readOnly);

document.body.appendChild(editor.container);

window.parent.addEventListener('message', handleMessage, false);
if (window.chrome != undefined && window.chrome.webview != undefined) {
    window.chrome.webview.addEventListener('message', handleMessage, false);
}
function handleMessage(e) {
    var data = "";
    if (typeof e.data == "string") {
        data = JSON.parse(e.data);
    } else {
        data = e.data;
    }

    switch (data["action"]) {
        case "setData":
            editor.setValue(data["content"]);
            editor.selection.setRange({
                start: 0,
                end: 0
            });
            break;
        case "getData":
            sendResult();
            break;
    }
}

function sendResult() {
    if (window.chrome != undefined && window.chrome.webview != undefined) {
        window.chrome.webview?.postMessage({"action": "result", "content": editor.getValue()});
    } else {
        window.parent.postMessage(JSON.stringify({"action": "result", "content": editor.getValue()}), "*");
    }
}

if (window.chrome != undefined && window.chrome.webview != undefined) {
    window.chrome.webview.postMessage({"action": "ready"});
} else {
    window.parent.postMessage(JSON.stringify({"action": "ready"}), "*");
}

