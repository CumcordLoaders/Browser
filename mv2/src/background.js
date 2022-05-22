import { log } from "../../lib/stdlib.js";

log(["Loading from", chrome.runtime.id]);

chrome.webRequest.onHeadersReceived.addListener(({ responseHeaders }) => {
    responseHeaders = responseHeaders.filter(header => header.name !== "content-security-policy");

    return { responseHeaders };
  },
  
  { urls: [ "*://*.discord.com/*", "*://discord.com/*" ] },
  ["blocking", "responseHeaders"]
);