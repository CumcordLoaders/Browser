import "modernlog/patch.js";

import { writeFile, readdir, readFile, access, mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { constants } from "node:fs";

import argv from "./argv.mjs";

import { rollup } from "rollup";
import esbuild from "rollup-plugin-esbuild";

import JSZip from "jszip";

let options = {
	plugins: [
		esbuild()
	]
};

let toBuild = {};

switch(argv.manifest) {
	case 2:
		toBuild = {
			background: "mv2/src/background.js",
			loader: "mv2/src/loader.js"
		}
	break;

	case 3:
		toBuild = {
			worker: "mv3/src/worker.js",
			content: "mv3/src/content.js"
		}
	break;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "..", "dist");

const fileExists = async (path) => access(path, constants.F_OK).then(() => true).catch(() => false);
async function deleteIfExists(path) {
	if(await fileExists(path)) await rm(path, { recursive: true, force: true });
}

(async () => {
	console.log(`Building Manifest V${argv.manifest} extension..`);

	// in the meantime of a rewrite
	let files = {
		lib: {
			"stdlib.js": await readFile(join(__dirname, "..", "ext", "lib", "stdlib.js")),
			"loader.js": await readFile(join(__dirname, "..", "ext", "lib", "loader.js")),
			"ipc.js": await readFile(join(__dirname, "..", "ext", "lib", "ipc.js"))
		},
		src: {
			"page_ipc.js": await readFile(join(__dirname, "..", "ext", "src", "page_ipc.js"))
		}
	};

	/*
		We have to build each file individually, otherwise rollup will create a separate file when there are multiple imports
		and will try to require() it, which is impossible in our current context
	*/
	for(const [file, path] of Object.entries(toBuild)) {
		console.log(`Building ${file}...`);
		let bundle = await rollup({
			...options,
			input: {
				[file]: path
			}
		});

		let { output } = await bundle.generate({
			format: "cjs",
			strict: false
		});

		// Include JavaScript files
		for (const data of output.filter(e => e.type === "chunk")) {
			files.src[`${data.name}.js`] = data.code;
		}
	}

	// Include icons
	let diskFolder = join(__dirname, "..", "ext", "icons");

	if(!files["icons"]) files["icons"] = {};

	const folderFiles = await readdir(diskFolder);
	for (const file of folderFiles)
		files["icons"][file] = await readFile(join(diskFolder, file));

	// Include manifest
	const manifest = { 
		...JSON.parse(await readFile(join(__dirname, "..", "ext", "manifest.json"))),
		...JSON.parse(await readFile(join(__dirname, "..", `mv${argv.manifest}`, "manifest.json")))
	};
	files["manifest.json"] = JSON.stringify(manifest, null, "	");

	if(argv.manifest == "3") {
		files["dnr_rules.json"] = await readFile(join(__dirname, "..", `mv${argv.manifest}`, "dnr_rules.json"))
	}

	if(argv.clean) await deleteIfExists(dist);
	if(!await fileExists(dist)) await mkdir(dist);
	
	if(argv.format === "folder") {
		const folder = join(dist, `mv${argv.manifest}`);
		await deleteIfExists(folder);
		await mkdir(folder);

		async function processFiles(entries = files, subfolder) {
			const path = join(folder, subfolder ?? "");
			if(subfolder) await mkdir(path);

			for(const [name, data] of Object.entries(entries)) {
				if(typeof(data) === "string" || data instanceof Buffer) {
					await writeFile(join(path, name), data);
				} else if(typeof(data) === "object") {
					await processFiles(data, name);
				}
			}
		}

		await processFiles();
	} else if(["zip", "xpi"].includes(argv.format)) {
		let zip = JSZip();

		async function processFiles(entries = files, subfolder) {
			for(const [name, data] of Object.entries(entries)) {
				if(typeof(data) === "string" || data instanceof Buffer) {
					(subfolder ?? zip).file(name, data);
				} else if(typeof(data) === "object") {
					await processFiles(data, zip.folder(name));
				}
			}
		}

		await processFiles();

		writeFile(join(dist, `mv${argv.manifest}.${argv.format}`), await zip.generateAsync({type: "nodebuffer"}));
	}
})();