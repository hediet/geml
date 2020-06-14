import { GitHub, context } from "@actions/github";
import { exec } from "@actions/exec";
import { readPackageJson } from "./shared";
import { SemanticVersion } from "@hediet/semver";

export async function run(): Promise<void> {
	const version = readPackageJson().version;
	if (version.toLowerCase() === "unreleased") {
		return;
	}

	const semVer = SemanticVersion.parse(version);
	let releaseTag: string | undefined = undefined;
	if (semVer.prerelease) {
		releaseTag = "" + semVer.prerelease.parts[0];
	}
	await exec("npm", [
		"publish",
		...(releaseTag ? ["--tag", releaseTag] : []),
	]);

	const gitTag = `v${version}`;
	console.log(`Creating a version tag "${gitTag}".`);
	const api = new GitHub(process.env.GITHUB_TOKEN!);
	await api.git.createRef({
		...context.repo,
		ref: `refs/tags/${gitTag}`,
		sha: context.sha,
	});
}
