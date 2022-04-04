function impregnate(tabId, code, detachOnFinish = true) {
    chrome.debugger.attach({
        tabId
    }, "1.3", () => {
        console.log("[CumChrome]", "Cumming in tab", tabId);

        chrome.debugger.sendCommand({
            tabId
        }, "Runtime.evaluate", {
            expression: code,
            allowUnsafeEvalBlockedByCSP: true
        }, () => {
            console.log("[CumChrome]", "Cummed in tab", tabId);
            if(detachOnFinish) chrome.debugger.detach({ tabId });
        });
    });
}

chrome.debugger.onDetach.addListener((debuggee, reason) => {
    console.error("[CumChrome]", "Tab", debuggee.tabId, "went to an abortion clinic", reason);
});

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    sendResponse();

    if(msg === "pwnme") {
        let cumcord = await (await fetch("https://raw.githubusercontent.com/Cumcord/builds/main/build.js")).text();
        let loader = await (await fetch(chrome.runtime.getURL("loader.js"))).text();

        impregnate(sender.tab.id, loader.replace("/extid/", chrome.runtime.id).replace("/placeholder/", cumcord));
    }
});

chrome.runtime.onConnectExternal.addListener(port => {
    port.onMessage.addListener(async msg => {
        if(msg.type) {
            if(msg.type === "fetch" && msg.url) {
                console.log("[CumCSP]", "Request to", msg.url);
                let res = await fetch(msg.url, msg.options);

                port.postMessage({text: await res.text(), init: {
                    status: res.status,
                    statusText: res.statusText,
                    headers: res.headers
                }});
            }
        }
    });
});