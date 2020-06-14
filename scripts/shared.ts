import { readFileSync } from "fs";
import { join } from "path";

export function readTextFileSync(fileName: string): string {
	return readFileSync(fileName, { encoding: "utf-8" });
}

export function readPackageJson(): { version: string } {
	return JSON.parse(readTextFileSync(join(__dirname, "../package.json")));
}
