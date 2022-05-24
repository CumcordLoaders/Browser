import { initializeContentIPC } from "@ipc";

chrome.runtime.sendMessage("pwnme");
initializeContentIPC();