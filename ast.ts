function format(node: GemlNode): void {}

function parseGemlDocument(text: string): GemlDocument {}

function parseGemlMarkupString(text: string): GemlMarkupString {}

class Trivias {}

abstract class GemlNode {
	srcRange: any | undefined;
	leadingTrivias: Trivias;
	trailingTrivias: Trivias;

	parent: GemlNode;
	parentKey: number | string;
	children: GemlNode[];

	abstract toString(): string;
}

class GemlHeader extends GemlNode {}

class GemlDocument extends GemlNode {}

class GemlHeader extends GemlNode {}

abstract class GemlValue extends GemlNode {}

class GemlPrimitive extends GemlValue {
	value: string;
}

abstract class GemlString extends GemlValue {
	value: string;
}

class GemlSinglelineString extends GemlString {}
class GemlMarkupString extends GemlString {}
class GemlHeredocString extends GemlString {}

class GemlStructuredValue extends GemlValue {}

abstract class GemlProperty extends GemlNode {}

class GemlNamedProperty extends GemlProperty {
	name: string;
}

class GemlPositionalProperty extends GemlProperty {
	value: GemlProperty;
}
