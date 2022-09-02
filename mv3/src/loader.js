import { initializePageIPC, communicate } from "@ipc";

async function patchFetch() {
	try {
		await fetch("https://google.com/?cumload-test");
		log(["Not patching fetch() because CSP is disabled", e], "csp");
	} catch(e) {
		log(["Patching fetch() because CSP is not disabled", e], "csp");

		window.fetch = async (...args) => {
			const url = args[0] instanceof URL ? args[0].href : args[0];
			const result = await communicate({type: "fetch", url, options: args[1] ?? {}});
					
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

		return true;
	}
}

log(["Waiting for inject time..."]);

waitForDiscordToLoad().then(async () => {
	await patchFetch();

	log(["Injecting Cumcord"]);

	// This gets replaced by the worker at runtime
	doit();

	await cumcord.cum();
	initializePageIPC();
}).catch(e => {
	log(["Cumcord will not be injected", "\n", e], "error");
});