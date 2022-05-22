import { log } from "../../lib/stdlib.js";

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

		// doit() needs a function because Cumcord dist usually contains "$&" which puts doit() in random places and produces syntax errors
        impregnate(sender.tab.id, loader.replace("/extid/", chrome.runtime.id).replace("doit()", () => cumcord));
    }
});

chrome.runtime.onConnectExternal.addListener(port => {
    function messageHandler(msg) {
        if(msg.type) {
            if(msg.type === "fetch" && msg.url) {
                log(["Request to", msg.url], "csp");
                fetch(msg.url, msg.options).then(async res => {
                    if(port.onMessage.hasListener(messageHandler)) {
                        port.postMessage({
                            text: await res.text(), 
                            headers: Object.fromEntries([...res.headers]),

                            init: {
                                status: res.status,
                                statusText: res.statusText
                            }
                        });
                    }
                }).catch(e => {
                    let error = e.toString().split(": ");

                    if(port.onMessage.hasListener(messageHandler)) {
                        port.postMessage({
                            error : {
                                type: error[0],
                                text: error[1]
                            }
                        });
                    }
                });
            }
        }
    }

    async function disconnectHandler() {
        port.onMessage.removeListener(messageHandler);
        port.disconnect();
        port.onDisconnect.removeListener(disconnectHandler);
    }

    port.onMessage.addListener(messageHandler);
    port.onDisconnect.addListener(disconnectHandler);
});