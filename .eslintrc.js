module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	ignorePatterns: ["**/*.js"],

	rules: {
		"@typescript-eslint/no-non-null-assertion": "off",
		"no-mixed-spaces-and-tabs": "off",
	},
};
