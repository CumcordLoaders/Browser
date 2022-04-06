let sleep = () => new Promise(r => setTimeout(r));

function patchFetch() {
    window.fetch = async (...args) => {
        const url = args[0] instanceof URL ? args[0].href : args[0];
        const result = await communicate({type: "fetch", url, options: args[1] ?? {}});
        
        if(result.error) throw new (window[result.error.type] ?? Error)(result.error.text);

        let res = new Response(result.text, result.init);
        res.__defineGetter__("url", () => url);

        return res;
    };
}

async function communicate(data) {
    let port = chrome.runtime.connect("/extid/", {name: (Math.random() + 1).toString(36).substring(7)});

    return new Promise((resolve, reject) => {
        let listener = (msg) => {
            port.onMessage.removeListener(listener);
            port.disconnect();
            return resolve(msg);
        };

        port.onMessage.addListener(listener);
        port.postMessage(data);
        
        setTimeout(() => {
            port.onMessage.removeListener(listener);
            port.disconnect();
            reject(new Error("Request timed out."));
        }, 2000);
    });
}

(async () => {
    log(["Patching fetch()"]);
    patchFetch();

    log(["Waiting for inject time..."]);
    while(!document.querySelector('video[class*="ready-"]')) await sleep();
    while(document.querySelector('video[class*="ready-"]')) await sleep();
    log(["Injecting Cumcord"]);

    /placeholder/
})();