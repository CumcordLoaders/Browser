import { log, sleep, injectScriptTag, waitForDiscordToLoad } from "../../lib/stdlib.js";
let toWindow = [ log, sleep, injectScriptTag, waitForDiscordToLoad ];

// :trolla:, I HATE THIS
for(const func of toWindow)
	injectScriptTag(`window["${func.name}"] = ${func};`)

injectScriptTag(() => {
    log(["Waiting for inject time..."]);

    waitForDiscordToLoad().then(async () => {
		log(["Injecting Cumcord"]);

    	injectScriptTag(await (await fetch("https://raw.githubusercontent.com/Cumcord/builds/main/build.js")).text());
	}).catch(e => {
		log(["Cumcord will not be injected", "\n", e], "error");
	});
});