import {} from "mocha";
import { parseGemlMarkupString } from "../src";

describe("Test", () => {
	it("works", () => {
		const d = parseGemlMarkupString("Foo {Bold <Bar> <Foo>} Buzz");

		console.log(JSON.stringify(d, undefined, 4));
	});
});
