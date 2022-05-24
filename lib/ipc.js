export function sendData(data, eventName = "cumcord-ipc") {
	const ccEvent = new CustomEvent(eventName, {
		detail: data
	});

	return window.dispatchEvent(ccEvent);
}

// To be ran in a background page/service worker
export function initializeBackgroundIPC() {
	log(["Initializing background IPC"], "ipc");
	let ports = {
		website: {},
		discord: {}
	};
	
	// Handler for CumIPC (website <-> cumcord)
	chrome.runtime.onConnect.addListener(port => {
		let portSpace = port.name.split("-")[0];

		log(["New", portSpace, "connected", port], "ipc");
	
		ports[portSpace][port.name] = port;
		port.onDisconnect.addListener(() => delete ports[portSpace][port.name]);
	
		if(portSpace === "website") {
			port.onMessage.addListener(msg => {			
				log(["message from website", msg], "ipc")
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
	log(["Initializing content script IPC"], "ipc");
	let port;

	window.addEventListener("cumload", event => {
		if(event.detail.action && event.detail.action == "CUMCORD_LOADED" && !port) {
			port = chrome.runtime.connect({name: "discord-" + randomUUID()});
			port.onMessage.addListener(e => {
				sendData(e);
				window.postMessage({
					...e,
					type: "cumcord-ipc"
				}, "*");
			});
		} else if(port) {
			port.postMessage(event.detail);
		}
	}, false);
}

// To be ran inside of discord.com (i.e a <script> tag)
export function initializePageIPC() {
	log(["Initializing page IPC"], "ipc");
	/*
		The reason we HAVE to do it like this instead of using a CustomEvent
		is because of Firefox restricting the detail prop on CustomEvents coming from a content script.
		if you find a workaround, give it to me
	*/
	window.addEventListener("message", event => {
		if(event.data.type && event.data.type === "cumcord-ipc") {
			cumcord.websocket.triggerHandler(JSON.stringify(event.data), (data) => sendData(JSON.parse(data), "cumload"));
		}
	});

	sendData({
		action: "CUMCORD_LOADED"
	}, "cumload");
}