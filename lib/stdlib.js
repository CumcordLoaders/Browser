export const sleep = () => new Promise(r => setTimeout(r));

export function log(input, type = "info", title = "CumLoad", color = "#ff5252") {
    if(type == "csp") {
        color = "#368551";
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

export async function waitForDiscordToLoad() {
	return new Promise(async (resolve, reject) => {
		setTimeout(() => {
			if(!window.webpackChunkdiscord_app) {
				return reject(new Error("Timed out, are you on a client page ?"))
			}
		}, 5000);

		while(!window.webpackChunkdiscord_app) await sleep();
		while(window.webpackChunkdiscord_app.length < 47) await sleep();
		return resolve(true);
	});
}

export function injectScriptTag(script) {
    if(typeof(script) == "function") script = `(${script})()`;

    const domNode = document.createElement("script");
    domNode.appendChild(document.createTextNode(script));

    return (document.head || document.body).appendChild(domNode);
}

export function putInWindow(func) {
	if(typeof(func) == "function" && func.name) {
		return injectScriptTag(`window["${func.name}"] = func`);
	}
}