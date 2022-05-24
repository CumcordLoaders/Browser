import { initializeBackgroundIPC } from "@ipc";

log(["Loading from", chrome.runtime.id]);

// CSP Bypass
chrome.webRequest.onHeadersReceived.addListener(({ responseHeaders }) => {
    responseHeaders = responseHeaders.filter(header => header.name !== "content-security-policy");

    return { responseHeaders };
  },
  
  { urls: [ "*://*.discord.com/*", "*://discord.com/*" ] },
  ["blocking", "responseHeaders"]
);

initializeBackgroundIPC();