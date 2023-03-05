async function waitForDiscordToLoad() {
	return new Promise(async (resolve, reject) => {
		setTimeout(() => {
			if(!window.webpackChunkdiscord_app) {
				return reject(new Error("Timed out, are you on a client page ?"))
			}
		}, 5000);

		while(!window.webpackChunkdiscord_app) await sleep();

		const wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, (w) => w]);
		webpackChunkdiscord_app.pop();

		const checkModules = () => Object.values(wpRequire.c).some((m) =>
				m.exports?.default?.getCurrentUser?.()
			);

		while (!checkModules()) await sleep(100);

		return resolve(true);
	});
}

async function patchFetch() {
	try {
		await fetch("https://raw.githubusercontent.com/uwu/uwu/uwu/uwu?cumload-test");
		log(["Not patching fetch() because CSP is disabled"], "csp");
	} catch(e) {
		log(["Patching fetch() because CSP is not disabled"], "csp");

		window.fetch = async function fetch(...args) {
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

const loaderContext = [ waitForDiscordToLoad, sleep, log, isURLValid, patchFetch ];
async function loadClient() {
	log(["Manifest version:", cumload.manifest.version.toString()]);
	log(["Waiting for inject time..."]);

	waitForDiscordToLoad().then(async () => {
		await patchFetch();

		log(["Injecting", cumload.client.name]);

		if(cumload.manifest.version == "2") {
			const scriptContent = await fetch(cumload.client.scriptURL).then(res => res.text());

			injectScriptTag(scriptContent);
		} else {
			// This gets replaced by the worker at runtime
			doit();
		}
		
		await cumcord.cum();
		initializePageIPC();
	}).catch(e => {
		log(["Could not load", cumload.client.name, "\n", e], "error");
	});
}

const clients = {
	cumcord: {
		name: "Cumcord",
		scriptURL: "https://raw.githubusercontent.com/Cumcord/builds/main/build.js"
	}
};

async function getLoadScript(client) {
	const cumload = {
		manifest: {
			version: getManifestVersion()
		},

		client: clients[client]
	};

	let context = [
		`window.cumload = ${JSON.stringify(cumload)}`,
		...loaderContext
	];

	if(cumload.manifest.version == "2") {
		context = [ ...context, manipulateScript, injectScriptTag, sendData, initializePageIPC, communicate ];
	} else {
		context = [ ...context, initializeContentIPC ]
	}

	let script = manipulateScript(loadClient, context);

	if(cumload.manifest.version == "3") {
		const clientMod = await fetch(cumload.client.scriptURL).then(res => res.text());

		script = script.replace("doit()", () => clientMod);
	}

	return script;
}