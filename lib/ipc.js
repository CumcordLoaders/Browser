export function sendData(data, eventName = "cumcord-ipc") {
	const ccEvent = new CustomEvent(eventName, {
		detail: data
	});

	return window.dispatchEvent(ccEvent);
}

// To be ran in a background page/service worker
export function initializeBackgroundIPC() {
	let ports = {
		website: {},
		discord: {}
	};
	
	// Handler for CumIPC (website <-> cumcord)
	chrome.runtime.onConnect.addListener(port => {
		let portSpace = port.name.split("-")[0];
	
		ports[portSpace][port.name] = port;
		port.onDisconnect.addListener(() => delete ports[portSpace][port.name]);
	
		if(portSpace === "website") {
			port.onMessage.addListener(msg => {			
				if (Object.keys(ports.discord).length > 0) {
					Object.values(ports.discord).at(-1).postMessage({
						...msg,
						uuid: `${port.name}|${msg.uuid ?? randomUUID()}`
					});
				} else {
					// no ports ?
					port.postMessage({ status: "ERROR", name: "CUMLOAD_NO_DISCORD" });
				}
			});
		} else if(portSpace === "discord") {
			port.onMessage.addListener(msg => {
				let website = msg.uuid.split("|")[0];
				
				if(ports.website[website]) {
					ports.website[website].postMessage(msg);
				}
			});
		}
	});
}

// To be ran on a content-script running on discord.com
export function initializeContentIPC() {
	let port;

	window.addEventListener("cumload", event => {
		if(event.detail.action && event.detail.action == "CUMCORD_LOADED" && !port) {
			port = chrome.runtime.connect({name: "discord-" + randomUUID()});
			port.onMessage.addListener(e => sendData(e));
		} else if(port) {
			port.postMessage(event.detail);
		}
	}, false);
}

// To be ran inside of discord.com (i.e a <script> tag)
export function initializePageIPC() {
	window.addEventListener("cumcord-ipc", event => {
		cumcord.websocket.triggerHandler(JSON.stringify(event.detail), (data) => sendData(JSON.parse(data), "cumload"));
	});

	sendData({
		action: "CUMCORD_LOADED"
	}, "cumload");
}