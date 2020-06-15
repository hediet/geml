import {} from "mocha";
import { parseGemlMarkupString, GemlNode } from "../src";
import { fromEntries } from "./utils";
import { deepEqual } from "assert";

describe("Test", () => {
	it("works", () => {
		const doc = parseGemlMarkupString("Foo {Bold <Bar> <Foo>} Buzz");

		deepEqual(toSimpleJson(doc), {
			kind: "markupStringDocument",
			content: [
				"Foo ",
				{
					kind: "object",
					properties: {},
					args: [
						{
							kind: "markupString",
							content: ["Bar"],
						},
						{
							kind: "markupString",
							content: ["Foo"],
						},
					],
				},
				" Buzz",
			],
		});
	});
});

function toSimpleJson(node: GemlNode): unknown {
	switch (node.kind) {
		case "markupStringDocument": {
			const content = node.content.nodes.map((n) =>
				n.kind === "object" ? toSimpleJson(n) : n.value
			);
			return { kind: "markupStringDocument", content };
		}
		case "object": {
			const props = node
				.getNamedProperties()
				.map((p) => [p.nameText, toSimpleJson(p.value)] as const);
			return {
				kind: "object",
				properties: fromEntries(props),
				args: node
					.getPositionalProperties()
					.map((p) => toSimpleJson(p.value)),
			};
		}
		case "markupString": {
			const content = node.content.nodes.map((n) =>
				n.kind === "object" ? toSimpleJson(n) : n.value
			);
			return { kind: "markupString", content };
		}
		default:
			return { kind: node.kind };
	}
}
