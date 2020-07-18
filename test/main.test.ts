import {} from "mocha";
import { parseGemlMarkupString, GemlNode } from "../src";
import { fromEntries } from "./utils";
import { deepEqual } from "assert";
import { parseGeml } from "../src/helpers";

describe("Parser", () => {
	describe("parseGemlMarkupString", () => {
		it("supports string", () => {
			deepEqual(toSimpleJson(parseGemlMarkupString("Str1 Str2")), {
				kind: "markupStringDocument",
				content: ["Str1 Str2"],
			});
		});

		it("supports strings mixed with objects", () => {
			deepEqual(toSimpleJson(parseGemlMarkupString("Str1 {Obj1} Str2")), {
				content: [
					"Str1 ",
					{
						kind: "object",
						type: "Obj1",
						args: [],
						properties: {},
					},
					" Str2",
				],
				kind: "markupStringDocument",
			});
		});

		it("supports empty strings mixed with objects", () => {
			deepEqual(toSimpleJson(parseGemlMarkupString("{Obj1}")), {
				kind: "markupStringDocument",
				content: [
					{
						kind: "object",
						type: "Obj1",
						args: [],
						properties: {},
					},
				],
			});
		});
	});

	describe("objects", () => {
		it("properties and args", () => {
			deepEqual(
				toSimpleJson(
					parseGeml("{Obj1 prop1:{Obj2} {Obj3} prop2:{Obj4}}")
				),
				{
					kind: "document",
					values: [
						{
							args: [
								{
									args: [],
									kind: "object",
									properties: {},
									type: "Obj3",
								},
							],
							kind: "object",
							properties: {
								prop1: {
									args: [],
									kind: "object",
									properties: {},
									type: "Obj2",
								},
								prop2: {
									args: [],
									kind: "object",
									properties: {},
									type: "Obj4",
								},
							},
							type: "Obj1",
						},
					],
				}
			);
		});
	});

	describe("arrays", () => {
		it("simple array", () => {
			deepEqual(toSimpleJson(parseGeml("[1 2 3]")), {
				kind: "document",
				values: [
					{
						items: [
							{ kind: "primitive", value: "1" },
							{ kind: "primitive", value: "2" },
							{ kind: "primitive", value: "3" },
						],
						kind: "array",
					},
				],
			});
		});
	});

	describe("primitive", () => {
		it("test1", () => {
			deepEqual(
				toSimpleJson(
					parseGeml(
						`[
							999999999999999999999
							true=;
							.1.0.,0.
						]`
					)
				),
				{
					kind: "document",
					values: [
						{
							items: [
								{
									kind: "primitive",
									value: "999999999999999999999",
								},
								{
									kind: "primitive",
									value: "true=;",
								},
								{
									kind: "primitive",
									value: ".1.0.,0.",
								},
							],
							kind: "array",
						},
					],
				}
			);
		});
	});

	describe("string", () => {
		it("test1", () => {
			deepEqual(toSimpleJson(parseGeml(`<Str\\>\\<\\{\\}1>`)), {
				kind: "document",
				values: [
					{
						content: ["Str><{}1"],
						kind: "markupString",
					},
				],
			});
		});
	});
});

function toSimpleJson(node: GemlNode): unknown {
	switch (node.kind) {
		case "document": {
			return {
				kind: "document",
				values: node.values.nodes.map(toSimpleJson),
			};
		}
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
				type: node.type ? node.type.text : undefined,
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
		case "array": {
			const items = node.items.nodes.map((n) => toSimpleJson(n));
			return { kind: "array", items };
		}
		case "primitive": {
			return {
				kind: "primitive",
				value: node.value.text,
			};
		}
		default:
			return { kind: node.kind };
	}
}
