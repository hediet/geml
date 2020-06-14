import { readPackageJson } from "./shared";

export async function run(): Promise<void> {
	const packageJson = readPackageJson();
	if (packageJson.version !== "set-version-from-changelog") {
		throw new Error(
			`Version must be "set-version-from-changelog", but was "${packageJson.version}"`
		);
	}
}
