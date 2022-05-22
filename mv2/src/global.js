window.addEventListener("message", event => {
	if(event.data.type && event.data.type == "cumcord") {
		console.log(event);
		chrome.runtime.sendMessage(event.data);
	}
}, false);