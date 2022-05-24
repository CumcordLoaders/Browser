import { initializePageIPC } from "@ipc";

function patchFetch() {
    window.fetch = async (...args) => {
        const url = args[0] instanceof URL ? args[0].href : args[0];
        const result = await communicate({type: "fetch", url, options: args[1] ?? {}}, "/extid/");
        
        if(result.error) throw new (window[result.error.type] ?? Error)(result.error.text);
        const headers = new Headers(result.headers ?? {});

        let res = new Response(result.text, result.init);
		Object.defineProperties(res, {
			url: {
				value: url,
				writable: false
			},

			headers: {
				value: headers,
				writable: false
			}
		});

        return res;
    };
}

async function communicate(data, extid, timeout = 2000) {
    let port = chrome.runtime.connect(extid, {name: (Math.random() + 1).toString(36).substring(7)});

    return new Promise((resolve, reject) => {
        let listener = (msg) => {
            port.onMessage.removeListener(listener);
            port.disconnect();
            return resolve(msg);
        };

        port.onMessage.addListener(listener);
        port.postMessage(data);
        
		if(timeout !== Infinity) {
			setTimeout(() => {
				port.onMessage.removeListener(listener);
				port.disconnect();
				reject(new Error("Request timed out."));
			}, timeout);
		}
    });
}

// The stuff happens here
log(["Patching fetch()"]);
patchFetch();

log(["Waiting for inject time..."]);

waitForDiscordToLoad().then(async () => {
	log(["Injecting Cumcord"]);

	// This gets replaced by the worker at runtime
	doit();

	await cumcord.cum();
	initializePageIPC();
}).catch(e => {
	log(["Cumcord will not be injected", "\n", e], "error");
});