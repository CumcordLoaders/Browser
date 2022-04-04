log(["Loading from extension ID", chrome.runtime.id]);

// Directly taken from Cumcord, once again, TODO: find a way to avoid redundant code like this
function log(input, type = "info", title = "CumChrome", color = "#ff5252") {
    if(type == "csp") {
        color = "#7ac091";
        title = "CumCSP";
        type = "info";
    }

    console[type](
      `%c${title}%c`,
      `background-color: ${color}; color: white; border-radius: 4px; padding: 0px 6px 0px 6px; font-weight: bold`,
      "",
      ...input,
    );
}

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
        let loader = await (await fetch(chrome.runtime.getURL("loader.js"))).text();

        impregnate(sender.tab.id, loader.replace("/extid/", chrome.runtime.id).replace("/placeholder/", cumcord));
    }
});

chrome.runtime.onConnectExternal.addListener(port => {
    async function messageHandler(msg) {
        if(msg.type) {
            if(msg.type === "fetch" && msg.url) {
                log(["Request to", msg.url], "csp");
                let res = await fetch(msg.url, msg.options);

                // Sometimes clients disconnect before receiving the response, therefore causing errors in the extension tab
                if(port.onMessage.hasListener(messageHandler)) {
                    port.postMessage({text: await res.text(), init: {
                        status: res.status,
                        statusText: res.statusText,
                        headers: res.headers
                    }});
                }
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