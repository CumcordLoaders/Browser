import { sendData, initializePageIPC, initializeContentIPC } from "@ipc";

// Listen to answers from cc
initializeContentIPC();

injectScriptTag(() => {
	log(["Waiting for inject time..."]);

	waitForDiscordToLoad().then(async () => {
		log(["Injecting Cumcord"]);
	
		injectScriptTag(await (await fetch("https://raw.githubusercontent.com/Cumcord/builds/main/build.js")).text());
		
		await cumcord.cum();
		initializePageIPC();
	}).catch(e => {
		log(["Cumcord will not be injected", "\n", e], "error");
	});
}, [ ...loaderContext, injectScriptTag, sendData, initializePageIPC ]);