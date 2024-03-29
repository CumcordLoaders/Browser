function sendData(data, eventName = "cumcord-ipc") {
	const ccEvent = new CustomEvent(eventName, {
		detail: data
	});

	return window.dispatchEvent(ccEvent);
}

// basically async sendData()
async function communicate(data, timeout = 3000) {
	let id = crypto.randomUUID(); // TODO: remove usage of crypto module

	sendData({...data, id}, "cumload");
		
	return new Promise((resolve, reject) => {
		let listener = (msg) => {
				if(msg.data.id && msg.data.id === id) {
				window.removeEventListener("message", listener);
				return resolve(msg.data);
			}
		};

		window.addEventListener("message", listener);
				
		if(timeout !== Infinity) {
			setTimeout(() => {
				window.removeEventListener("message", listener);
				reject(new Error("Request timed out."));
			}, timeout);
		}
	});
}

// To be ran in a background page/service worker
function initializeBackgroundIPC() {
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
	
		function reply(...args) {
			if(ports[portSpace][port.name]) {
				return port.postMessage(...args);
			} else {
				log(["Did not send data to", port.name, "because it is disconnected"], "error");
			}
		}

		if(portSpace === "website") {
			port.onMessage.addListener(msg => {			
				if (Object.keys(ports.discord).length > 0) {
					Object.values(ports.discord).at(-1).postMessage({
						...msg,
						type: "cumcord-ipc",
						uuid: `${port.name}|${msg.uuid ?? randomUUID()}`
					});
				} else {
					// no ports ?
					reply({ status: "ERROR", name: "CUMLOAD_NO_DISCORD" });
				}
			});
		} else if(portSpace === "discord") {
			port.onMessage.addListener(msg => {
				if(msg.type === "cumcord-sync") {
					Object.values(ports.discord)
						.filter(instance => instance.name !== port.name)
						.forEach(instance => instance.postMessage(msg));
				} else if(msg.type === "fetch" && msg.url && msg.id) {
					log(["Request to", msg.url], "csp");
					
					fetch(msg.url, msg.options).then(async res => {
						reply({
							text: await res.text(), 
							headers: Object.fromEntries([...res.headers]),

							init: {
								status: res.status,
								statusText: res.statusText
							},

							id: msg.id
						});
					}).catch(e => {
							let error = e.toString().split(": "); // e.message ?

							reply({
								error : {
									type: error[0],
									text: error[1]
								},

								id: msg.id
							});
					});
				} else {
					let website = msg.uuid.split("|")[0];
				
					if(ports.website[website]) {
						ports.website[website].postMessage(msg);
					}
				}
			});
		}
	});
}

// To be ran inside of a content-script running on discord.com
function initializeContentIPC() {
	log(["Initializing content script IPC"], "ipc");
	let port = chrome.runtime.connect({name: "discord-" + randomUUID()});
	port.onMessage.addListener(e => window.postMessage(e, "*"));;

	window.addEventListener("cumload", event => {
		port.postMessage(event.detail);
	}, false);
}

// To be ran inside of discord.com (i.e a <script> tag)
function initializePageIPC() {
	log(["Initializing page IPC"], "ipc");
	const orders = new Map();

	/*
		The reason we HAVE to do it like this instead of using a CustomEvent
		is because of Firefox restricting the detail prop on CustomEvents coming from a content script.
		if you find a workaround, give it to me
	*/
	window.addEventListener("message", event => {
		if(event.data.type) {
			if(event.data.type === "cumcord-ipc") {
				cumcord.websocket.triggerHandler(JSON.stringify(event.data), (data) => sendData(JSON.parse(data), "cumload"));
			} else if(event.data.type === "cumcord-sync") {
				if(event.data.action === "PLUGIN_SET") {
					if(cumcord.plugins.installed.ghost[event.data.url] == null) {
						orders.set(event.data.url);
						cumcord.plugins.importPlugin(event.data.url);
					} else if(event.data.enabled !== undefined && event.data.enabled !== cumcord.plugins.installed.ghost[event.data.url].enabled) {
						orders.set(event.data.url);
						cumcord.plugins.togglePlugin(event.data.url);
					}
				} else if(event.data.action === "PLUGIN_DELETE" && cumcord.plugins.installed.ghost[event.data.url] !== null) {
					orders.set(event.data.url);
					cumcord.plugins.removePlugin(event.data.url);
				} else if(event.data.action === "PLUGIN_IDB") {
					/*
						IndexedDB changes propagate accross the whole browser without the need of intervention
						so we just reload the plugin when idb changes are detected from within another tab,
						although a way to emit events directly into the plugin's nest would be preferrable
						because desync can still occur in edge cases (both plugins' settings opened in two
						separate tabs).
					*/
					setTimeout(() => {
						orders.set(event.data.url);
						cumcord.plugins.togglePlugin(event.data.url);
						orders.set(event.data.url);
						cumcord.plugins.togglePlugin(event.data.url);
					}, 50); // 50ms seems to be enough for the idb changes to propagate accross tabs
				}
			}
		}
	});

	function handlePluginUpdate(action, data) {
		const [ url ] = data.path;

		if(orders.has(url)) return orders.delete(url);

		let toSend = {
			type: "cumcord-sync",
			action: `PLUGIN_${action}`,
			url: url
		}

		if(data.path.length == 2) {
			toSend[data.path[1]] = data.value;
		}

		return sendData(toSend, "cumload");
	}

	// This handles plugin addition, deletion and toggles.
	cumcord.plugins.installed.on("SET", handlePluginUpdate);
	cumcord.plugins.installed.on("DELETE", handlePluginUpdate);

	// This handles plugin data changes (IndexedDB)
	cumcord.patcher.after("set", cumcord.modules.internal.idbKeyval, ([child, data]) => {
		if(child.endsWith("_CUMCORD_STORE") && isURLValid(child)) {
			sendData({
				type: "cumcord-sync",
				action: "PLUGIN_IDB",
				/*
					Only replace the last occurence of _CUMCORD_STORE
					just incase someone has the bright idea to put it in their plugin's URL.
				*/
				url: child.replace(/_CUMCORD_STORE$/, "")
			}, "cumload");
		}
	});

	/*sendData({
		action: "CUMCORD_LOADED"
	}, "cumload");*/
}