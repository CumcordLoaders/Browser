function sleep() {
	return new Promise(r => setTimeout(r));
}

function log(input, type = "info", title = "CumLoad", color = "#ff5252") {
    if(type == "csp") {
        color = "#368551";
        title = "CumCSP";
        type = "info";
    } if(type == "ipc") {
		color = "#363e85";
		title = "CumIPC";
		type = "info";
	}

    console[type](
        `%c${title}%c`,
        `background-color: ${color}; color: white; border-radius: 4px; padding: 0px 6px 0px 6px; font-weight: bold`,
        "",
        ...input,
    );
}

async function waitForDiscordToLoad() {
	const modContainsColors = (mod) => {
		// module is a function
		const fTxt = mod.toString().toLowerCase();
		return ["sizes", "colors", "looks", "dropdownsizes"].every((p) => fTxt.includes(p));
	}

	return new Promise(async (resolve, reject) => {
		setTimeout(() => {
			if(!window.webpackChunkdiscord_app) {
				return reject(new Error("Timed out, are you on a client page ?"))
			}
		}, 5000);

		while(!window.webpackChunkdiscord_app) await sleep();

		// There is no point in patching if it's already there
		for (const chunk of window.webpackChunkdiscord_app)
			for (const module of Object.values(chunk[1]))
			if (modContainsColors(module))
				return resolve(true);

		const origPush = window.webpackChunkdiscord_app.push;
	
		// Patch webpack chunk
		window.webpackChunkdiscord_app.push = function (...args) {
			// Should be one arg: [id, newModules, runOnLoad]
			const [[, newModules]] = args;
		
			for (const module of Object.values(newModules)) 
			if (modContainsColors(module)) {
				resolve(true);
				// Unpatch
				window.webpackChunkdiscord_app.push = origPush;
			}
			
		
			return origPush.apply(this, args);
		};
	});
}

function injectScriptTag(script, context) {
    if(typeof(script) == "function") script = `(${script})()`;
	if(context) script = context.join("\n") + "\n" + script;

    const domNode = document.createElement("script");
    domNode.appendChild(document.createTextNode(script));

    return (document.head || document.body).appendChild(domNode);
}

function randomUUID() {
	if(crypto.randomUUID) {
		return crypto.randomUUID();
	} else {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
}

function putInWindow(func) {
	if(typeof(func) == "function" && func.name) {
		return injectScriptTag(`window["${func.name}"] = func`);
	}
}