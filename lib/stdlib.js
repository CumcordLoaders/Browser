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
	return new Promise(async (resolve, reject) => {
		setTimeout(() => {
			if(!window.webpackChunkdiscord_app) {
				return reject(new Error("Timed out, are you on a client page ?"))
			}
		}, 5000);

		while(!window.webpackChunkdiscord_app) await sleep();
		while(window.webpackChunkdiscord_app.length < 50) await sleep();
		return resolve(true);
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