let sleep = () => new Promise(r => setTimeout(r));

function patchFetch() {
    window.fetch = async (...args) => {
        const url = args[0] instanceof URL ? args[0].href : args[0];
        const result = await communicate({type: "fetch", url, options: args[1] ?? {}});

        let res = new Response(result.text, result.init);
        res.__defineGetter__("url", () => res.url);

        return res;
    };
}

async function communicate(data) {
    let port = chrome.runtime.connect("/extid/", {name: (Math.random() + 1).toString(36).substring(7)});

    return new Promise((resolve, reject) => {
        let listener = (msg) => {
            resolve(msg);
            port.onMessage.removeListener(listener);
            port.disconnect();
        };

        port.onMessage.addListener(listener);
        port.postMessage(data);
        
        setTimeout(() => {
            port.onMessage.removeListener(listener);
            port.disconnect();
            reject("Request timed out.");
        }, 2000);
    });
}

(async () => {
    console.log("[CumChrome]", "Patching fetch()");
    patchFetch();

    console.log("[CumChrome]", "Waiting for inject time...");
    while(!document.querySelector('video[class*="ready-"]')) await sleep();
    while(document.querySelector('video[class*="ready-"]')) await sleep();
    console.log("[CumChrome]", "Injecting Cumcord");

    /placeholder/
})();