importScripts("stdlib.js");
import { initializeBackgroundIPC } from "@ipc";

log(["Loading from extension ID", chrome.runtime.id]);

function impregnate(tabId, code, detachOnFinish = true) {
    chrome.debugger.attach({
        tabId
    }, "1.3", () => {
        log(["Cumming in tab ID", tabId]);

        chrome.debugger.sendCommand({
            tabId
        }, "Runtime.evaluate", {
            expression: code,
            allowUnsafeEvalBlockedByCSP: true
        }, () => {
            log(["Cummed in tab ID", tabId]);
            if(detachOnFinish) chrome.debugger.detach({ tabId });
        });
    });
}

chrome.debugger.onDetach.addListener((debuggee, reason) => {
    log(["Tab", debuggee.tabId, "went to an abortion clinic", reason], "error");
});

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    sendResponse();

    if(msg === "pwnme" && new URL(sender.tab.url).pathname !== "/") {
        let cumcord = await (await fetch("https://raw.githubusercontent.com/Cumcord/builds/main/build.js")).text();
        let loader = await (await fetch(chrome.runtime.getURL("src/loader.js"))).text();

		// replace needs a function because Cumcord dist usually contains "$&" which puts doit() in random places and produces syntax errors
        impregnate(sender.tab.id, loaderContext.join("\n") + loader.replace("/extid/", chrome.runtime.id).replace("doit()", () => cumcord));
    }
});

initializeBackgroundIPC();