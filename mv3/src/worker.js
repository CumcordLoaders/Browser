importScripts("../lib/stdlib.js");
importScripts("../lib/ipc.js");
importScripts("../lib/loader.js");

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
        impregnate(sender.tab.id, await getLoadScript("cumcord"));
    }
});

initializeBackgroundIPC();