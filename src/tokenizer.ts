/* eslint-disable no-constant-condition */
import { Trivias, TokenKind } from "./ast";

const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numbers = "0123456789";
function getInStringMatcher(str: string): (c: string | undefined) => boolean {
	return (c: string | undefined) => {
		if (c === undefined) {
			return false;
		}
		if (c.length !== 1) return false;
		return str.indexOf(c) !== -1;
	};
}
const isValidIdentifierFirstLetter = getInStringMatcher(letters + "_");
const isValidIdentifierOtherLetter = getInStringMatcher(
	letters + numbers + "._-"
);
const isValidPrimitiveLetter = getInStringMatcher(
	letters + numbers + "_-+*=|~!?.,;/\"'()^&@%$#"
);
const isWhitespaceChar = getInStringMatcher(" \n\r\t");

export class Tokenizer {
	public pos = 0;
	public state: TokenizerState = { kind: "default" };

	constructor(private readonly source: string) {}

	public tryReadTrailingTrivias(): Trivias | undefined {
		while (true) {
			const t = this.tryRead(TokenKind.WhiteSpace);
			if (!t) {
				break;
			}
		}
		return undefined;
	}

	public tryReadLeadingTrivias(): Trivias | undefined {
		while (true) {
			const t = this.tryRead(TokenKind.WhiteSpace);
			if (!t) {
				break;
			}
		}
		return undefined;
	}

	public setState(state: TokenizerState): void {
		this.state = state;
	}

	public goto(pos: number): void {
		this.pos = pos;
	}

	public tryRead<T extends TokenKind>(kind: T): Token<T> | undefined {
		const p = this.pos;
		const t = this.read();
		if (t && t.kind === kind) {
			return t as Token<T>;
		}
		this.goto(p);
		return undefined;
	}

	public expect<T extends TokenKind>(kind: T): Token<T> | undefined {
		const t = this.read();
		if (!t || t.kind !== kind) {
			throw new Error("invalid token");
		}
		return t as Token<T>;
	}

	public read(): Token<TokenKind> | undefined {
		let curChar = this.source[this.pos];
		if (curChar === undefined) {
			return undefined;
		}
		this.pos++;

		if (this.state.kind === "default") {
			switch (curChar) {
				case "{":
					return {
						kind: TokenKind.CurlyBracketOpened,
						text: curChar,
					};
				case "}":
					return {
						kind: TokenKind.CurlyBracketClosed,
						text: curChar,
					};
				case "<":
					// try read identifier
					return {
						kind: TokenKind.AngleBracketOpened,
						text: curChar,
					};
				case ">":
					return {
						kind: TokenKind.AngleBracketClosed,
						text: curChar,
					};
				case "[":
					return {
						kind: TokenKind.SquareBracketOpened,
						text: curChar,
					};
				case "]":
					return {
						kind: TokenKind.SquareBracketClosed,
						text: curChar,
					};
				case "!":
					return { kind: TokenKind.ExclamationMark, text: curChar };
				case ":":
					return { kind: TokenKind.Colon, text: curChar };
				case '"':
					return { kind: TokenKind.SinglelineString, text: curChar };
				default:
					if (isWhitespaceChar(curChar)) {
						while (isWhitespaceChar(this.source[this.pos])) {
							curChar += this.source[this.pos];
							this.pos++;
						}
						return { kind: TokenKind.WhiteSpace, text: curChar };
					} else if (isValidPrimitiveLetter(curChar)) {
						while (isValidPrimitiveLetter(this.source[this.pos])) {
							curChar += this.source[this.pos];
							this.pos++;
						}
						return { kind: TokenKind.Primitive, text: curChar };
					}

					return { kind: TokenKind.Invalid, text: curChar };
			}
		} else if (this.state.kind === "inMarkupString") {
			switch (curChar) {
				case "{":
					return {
						kind: TokenKind.CurlyBracketOpened,
						text: curChar,
					};
				case "}":
					return {
						kind: TokenKind.CurlyBracketOpened,
						text: curChar,
					};
				case "<":
					// try read identifier
					return {
						kind: TokenKind.AngleBracketOpened,
						text: curChar,
					};
				case ">":
					return {
						kind: TokenKind.AngleBracketClosed,
						text: curChar,
					};
				case "\\":
					return this.readEscapeSeq();
				default:
					while (
						this.source[this.pos] !== undefined &&
						"{}<>\\".indexOf(this.source[this.pos]) === -1
					) {
						curChar += this.source[this.pos];
						this.pos++;
					}
					return { kind: TokenKind.Text, text: curChar };
			}
		}

		// identifier
		// primitive
		// text
	}

	private readEscapeSeq(): Token<TokenKind.EscapeSequence> {
		const nextChar = this.source[this.pos];
		if (nextChar === undefined) {
			return { kind: TokenKind.EscapeSequence, text: "\\" };
		}
		this.pos++;

		return { kind: TokenKind.EscapeSequence, text: "\\" + nextChar };
	}

	public peek(): Token<TokenKind> | undefined {
		const p = this.pos;
		const t = this.read();
		this.goto(p);
		if (!t) {
			return undefined;
		}
		return t;
	}

	public peekKind(): TokenKind | undefined {
		const p = this.peek();
		if (p) {
			return p.kind;
		}
		return undefined;
	}
}
export interface Token<T extends TokenKind> {
	kind: T;
	text: string;
}

type TokenizerState =
	| {
			kind: "default";
	  }
	| {
			kind: "inHeredocString";
			delimiter: string;
	  }
	| {
			kind: "inSinglelineString";
	  }
	| {
			kind: "inMarkupString";
	  };
