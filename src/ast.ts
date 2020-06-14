export class Trivias {}

export interface Range {
	start: number;
	length: number;
}

export enum TokenKind {
	/**
	 * Example: `{`
	 */
	CurlyBracketOpened,
	/**
	 * Example: `}`
	 */
	CurlyBracketClosed,

	/**
	 * Example: `[`
	 */
	SquareBracketOpened,
	/**
	 * Example: `]`
	 */
	SquareBracketClosed,

	/**
	 * Example: `"`
	 */
	SinglelineString,
	/**
	 * Example: `"`
	 */
	SinglelineStringEnd,
	/**
	 * Example: `<`
	 */
	AngleBracketOpened,
	/**
	 * Example: `>`
	 */
	AngleBracketClosed,
	/**
	 * Example: `<ident<`
	 */
	HeredocStringStart,
	/**
	 * Example: `\ident`
	 */
	HeredocEscapeSequenceStart,
	/**
	 * Example: `>ident>`
	 */
	HeredocStringEnd,
	/**
	 * Example: `\", \n`
	 */
	EscapeSequence,
	/**
	 * Example: `Hello! How're you?`
	 */
	Text,
	/**
	 * Example: `0.1`
	 */
	Primitive,

	/**
	 * Example: `!`
	 */
	ExclamationMark,
	/**
	 * Example: `:`
	 */
	Colon,
	WhiteSpace,
	Comment,
	Invalid,
}

export type GemlNode =
	| GemlNodeList<GemlNode>
	| GemlToken<TokenKind>
	| GemlDocument
	| GemlValue
	| GemlMarkupStringDocument
	| GemlMarkupStringPart
	| GemlHeredocStringEscapeSequence
	| GemlNamedProperty
	| GemlPositionalProperty;

export abstract class GemlNodeBase {
	/*public srcRange: Range | undefined;
	public parent:
		| { node: GemlNodeBase; childKey: number | string }
		| undefined;*/

	abstract getChildren(): ReadonlyArray<GemlNodeBase>;

	//abstract toString(): string;
}

export class GemlNodeList<T extends GemlNodeBase> extends GemlNodeBase {
	public readonly kind = "list";

	public readonly nodes: T[];

	constructor(nodes: T[]) {
		super();
		this.nodes = nodes;
	}

	getChildren(): ReadonlyArray<GemlNodeBase> {
		return this.nodes;
	}
}

export class GemlToken<T extends TokenKind> extends GemlNodeBase {
	public readonly kind = "token";

	constructor(public readonly tokenKind: T, public readonly text: string) {
		super();
	}

	getChildren(): ReadonlyArray<GemlNodeBase> {
		return [];
	}

	public leadingTrivias: Trivias | undefined;
	public trailingTrivias: Trivias | undefined;
}

export class GemlDocument extends GemlNodeBase {
	public readonly kind = "document";

	getChildren(): ReadonlyArray<GemlNodeBase> {
		return [];
	}
}

export type GemlValue = GemlPrimitive | GemlString | GemlObject | GemlArray;

export abstract class GemlValueBase extends GemlNodeBase {}

export class GemlPrimitive extends GemlValueBase {
	public readonly kind = "primitive";

	constructor(public value: GemlToken<TokenKind.Primitive>) {
		super();
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		return [];
	}
}

export abstract class GemlString extends GemlValueBase {
	simpleValue: string | undefined;
}

export class GemlSinglelineString extends GemlString {
	public readonly kind = "singlelineString";

	public constructor(
		public startToken: GemlToken<TokenKind.SinglelineString>,
		public items: GemlNodeList<
			GemlToken<TokenKind.Text> | GemlToken<TokenKind.EscapeSequence>
		>,
		public endToken: GemlToken<TokenKind.SinglelineString> | undefined
	) {
		super();
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		const result = [this.startToken, this.items];
		if (this.endToken) {
			result.push(this.endToken);
		}
		return result;
	}
}

export class GemlMarkupStringDocument extends GemlNodeBase {
	public readonly kind = "markupStringDocument";

	private content: GemlNodeList<GemlObject | GemlMarkupStringPart>;

	public constructor(
		content: GemlNodeList<GemlObject | GemlMarkupStringPart>
	) {
		super();
		this.content = content;
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		return [this.content];
	}
}

export class GemlMarkupString extends GemlString {
	public readonly kind = "markupString";

	constructor(
		public startToken: GemlToken<TokenKind.AngleBracketOpened>,
		public content: GemlNodeList<GemlObject | GemlMarkupStringPart>,
		public endToken: GemlToken<TokenKind.AngleBracketClosed> | undefined
	) {
		super();
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		return [
			this.startToken,
			this.content,
			...(this.endToken ? [this.endToken] : []),
		];
	}
}

export class GemlMarkupStringPart extends GemlNodeBase {
	public readonly kind = "markupStringPart";

	get value(): string {
		return this.content.nodes.map((i) => i.text).join();
	}

	content: GemlNodeList<
		GemlToken<TokenKind.Text> | GemlToken<TokenKind.EscapeSequence>
	>;

	getChildren(): ReadonlyArray<GemlNodeBase> {
		return [this.content];
	}

	constructor(
		content: GemlNodeList<
			GemlToken<TokenKind.Text> | GemlToken<TokenKind.EscapeSequence>
		>
	) {
		super();
		this.content = content;
	}
}

export class GemlHeredocString extends GemlString {
	public readonly kind = "heredocStringPart";

	constructor(
		public startToken: GemlToken<TokenKind.HeredocStringStart>,
		public content: GemlNodeList<
			| GemlToken<TokenKind.Text>
			| GemlHeredocStringEscapeSequence
			| GemlToken<TokenKind.EscapeSequence>
		>,
		public endToken: GemlToken<TokenKind.HeredocStringEnd> | undefined
	) {
		super();
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		return [
			this.startToken,
			this.content,
			...(this.endToken ? [this.endToken] : []),
		];
	}
}

export class GemlHeredocStringEscapeSequence extends GemlNodeBase {
	public readonly kind = "heredocStringEscapeSequence";

	//public value: string | GemlObject,
	constructor(
		public startToken: GemlToken<TokenKind.HeredocEscapeSequenceStart>,
		public escapeSequence: GemlToken<TokenKind.EscapeSequence>,
		public obj: GemlObject | undefined
	) {
		super();
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		return [
			this.startToken,
			this.escapeSequence,
			...(this.obj ? [this.obj] : []),
		];
	}
}

export class GemlObject extends GemlValueBase {
	public readonly kind = "object";

	constructor(
		public startToken: GemlToken<TokenKind.CurlyBracketOpened>,
		public identifier: GemlToken<TokenKind.Primitive> | undefined,
		public properties: GemlNodeList<
			GemlNamedProperty | GemlPositionalProperty
		>,
		public endToken: GemlToken<TokenKind.CurlyBracketClosed> | undefined
	) {
		super();
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		return [this.properties];
	}
}

export class GemlNamedProperty extends GemlNodeBase {
	public readonly kind = "namedProperty";

	constructor(
		public name: GemlToken<TokenKind.Primitive> | GemlString,
		public value: GemlValueBase
	) {
		super();
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		return [this.name, this.value];
	}
}

export class GemlPositionalProperty extends GemlNodeBase {
	public readonly kind = "positionalProperty";

	constructor(public value: GemlValueBase) {
		super();
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		return [this.value];
	}
}

export class GemlArray extends GemlValueBase {
	public readonly kind = "array";

	constructor(public items: GemlNodeList<GemlValueBase>) {
		super();
	}

	public getChildren(): ReadonlyArray<GemlNodeBase> {
		return [this.items];
	}
}
