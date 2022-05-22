import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).option("manifest", {
	alias: "m",
	type: "number",
	description: "Manifest version (2 or 3)",
	default: 2
}).option("format", {
	alias: "f",
	type: "string",
	description: "File type (zip, xpi or folder)",
	default: "zip"
}).option("clean", {
	alias: "c",
	type: "boolean",
	description: "Deletes the dist folder",
	default: true
}).parse();

if(![2, 3].includes(argv.manifest)) {
	console.error("Invalid manifest version !");
	process.exit(1);
}

if(!["zip", "xpi", "folder"].includes(argv.format)) {
	console.error("Invalid output format");
	process.exit(1);
}

if(argv.manifest === 3 && argv.format === "xpi") {
	console.warn("Firefox does not support Manifest V3 !");
}

export default argv;