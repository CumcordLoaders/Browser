//import { randomUUID } from "@stdlib";
import { sendData } from "@ipc";

let port;

// Listen to requests from the webpage
window.addEventListener("cumload", event => {
	// Only connect to the background page on first request
	if(!port) {
		port = chrome.runtime.connect({name: "website-" + randomUUID()});
		port.onMessage.addListener(msg => sendData(msg));
	}

	if(event.detail.action && event.detail.action.toUpperCase() == "CUMLOAD") {
		return sendData({ message: chrome.runtime.id });
	} else {
		return port.postMessage(event.detail);
	}
}, false);