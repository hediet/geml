/* eslint-disable no-constant-condition */
import {
	GemlToken,
	TokenKind,
	GemlObject,
	GemlArray,
	GemlMarkupString,
	GemlHeredocString,
	GemlSinglelineString,
	GemlDocument,
	GemlMarkupStringDocument,
	GemlMarkupStringPart,
	GemlNodeList,
	GemlNamedProperty,
	GemlPositionalProperty,
	GemlValue,
	GemlPrimitive,
} from "./ast";
import { Tokenizer, Token } from "./tokenizer";

export class Parser {
	parseDocument(tokenizer: Tokenizer): GemlDocument {
		const obj = this.parseValue(tokenizer);
		return new GemlDocument(new GemlNodeList([obj]));
	}

	parseMarkupStringDocument(tokenizer: Tokenizer): GemlMarkupStringDocument {
		const items = this.parseMarkupStringContent(
			tokenizer,
			"markupStringDocument"
		);
		return new GemlMarkupStringDocument(new GemlNodeList(items));
	}

	parseMarkupStringContent(
		tokenizer: Tokenizer,
		context: "markupStringValue" | "markupStringDocument"
	): Array<GemlObject | GemlMarkupStringPart> {
		tokenizer.setState({ kind: "inMarkupString" });
		const items = new Array<GemlObject | GemlMarkupStringPart>();

		while (true) {
			const peeked = tokenizer.peekKind();
			if (peeked === TokenKind.CurlyBracketOpened) {
				tokenizer.setState({ kind: "default" });
				items.push(this.parseObject(tokenizer, false));
				tokenizer.setState({ kind: "inMarkupString" });
			} else if (
				peeked === TokenKind.Text ||
				peeked === TokenKind.EscapeSequence
			) {
				const partItems = Array<
					GemlToken<TokenKind.EscapeSequence | TokenKind.Text>
				>();
				let p: TokenKind | undefined = peeked;
				while (p === TokenKind.Text || p === TokenKind.EscapeSequence) {
					const token = tokenToAstToken(
						tokenizer.read() as
							| Token<TokenKind.EscapeSequence>
							| Token<TokenKind.Text>
					);
					partItems.push(token);
					p = tokenizer.peekKind();
				}

				items.push(
					new GemlMarkupStringPart(new GemlNodeList(partItems))
				);
			} else if (peeked === TokenKind.AngleBracketClosed) {
				if (context === "markupStringDocument") {
					throw new Error("Unexpected character found");
				} else {
					break;
				}
			} else if (peeked === undefined) {
				break;
			} else {
				throw new Error("Cannot happen");
			}
		}

		return items;
	}

	parseValue(tokenizer: Tokenizer): GemlValue {
		const pos = tokenizer.pos;
		tokenizer.tryReadLeadingTrivias();
		const kind = tokenizer.peekKind();
		tokenizer.goto(pos);

		if (kind === TokenKind.AngleBracketOpened) {
			return this.parseMarkupString(tokenizer);
		} else if (kind === TokenKind.CurlyBracketOpened) {
			return this.parseObject(tokenizer);
		} else if (kind === TokenKind.SquareBracketOpened) {
			return this.parseArray(tokenizer);
		} else if (kind === TokenKind.Primitive) {
			return this.parsePrimitive(tokenizer);
		}

		throw new Error("Not supported");
	}

	parsePrimitive(tokenizer: Tokenizer): GemlPrimitive {
		tokenizer.tryReadLeadingTrivias();
		const token = tokenizer.expect(TokenKind.Primitive)!;
		tokenizer.tryReadTrailingTrivias();
		return new GemlPrimitive(tokenToAstToken(token));
	}

	parseMarkupString(tokenizer: Tokenizer): GemlMarkupString {
		tokenizer.tryReadLeadingTrivias();
		const start = tokenizer.expect(TokenKind.AngleBracketOpened)!;
		const oldState = tokenizer.state;

		const items = this.parseMarkupStringContent(
			tokenizer,
			"markupStringValue"
		);

		const endToken = tokenizer.expect(TokenKind.AngleBracketClosed);
		tokenizer.tryReadTrailingTrivias();

		tokenizer.setState(oldState);

		return new GemlMarkupString(
			tokenToAstToken(start),
			new GemlNodeList(items),
			tokenToAstToken(endToken)
		);
	}

	parseHeredocString(tokenizer: Tokenizer): GemlHeredocString {
		throw new Error("Not implemented");
	}

	parseSinglelineString(tokenizer: Tokenizer): GemlSinglelineString {
		throw new Error("Not implemented");
	}

	parseObject(tokenizer: Tokenizer, readTrailingTrivias = true): GemlObject {
		tokenizer.tryReadLeadingTrivias();
		const startToken = tokenizer.expect(TokenKind.CurlyBracketOpened)!;
		const exclamationToken = tokenizer.tryRead(TokenKind.ExclamationMark);
		const identifierToken = tokenizer.tryRead(TokenKind.Primitive);
		tokenizer.tryReadTrailingTrivias();

		const props = new Array<GemlNamedProperty | GemlPositionalProperty>();

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const pos = tokenizer.pos;

			tokenizer.tryReadLeadingTrivias();
			const kind = tokenizer.peekKind();
			if (kind === undefined) {
				break;
			} else if (kind === TokenKind.CurlyBracketClosed) {
				break;
			}
			// try parse identifier

			const identifierToken = tokenizer.tryRead(TokenKind.Primitive);
			let propInfo:
				| {
						name: GemlToken<TokenKind.Primitive>;
						colonToken: GemlToken<TokenKind.Colon>;
				  }
				| undefined;

			if (identifierToken) {
				const colonToken = tokenizer.tryRead(TokenKind.Colon);
				if (colonToken) {
					propInfo = {
						name: tokenToAstToken(identifierToken),
						colonToken: tokenToAstToken(colonToken),
					};
					tokenizer.tryReadTrailingTrivias();
				}
			}

			if (!propInfo) {
				tokenizer.goto(pos);
			}

			const val = this.parseValue(tokenizer);

			if (propInfo) {
				const prop = new GemlNamedProperty(propInfo.name, val);
				props.push(prop);
			} else {
				const prop = new GemlPositionalProperty(val);
				props.push(prop);
			}
		}

		const endToken = tokenizer.expect(TokenKind.CurlyBracketClosed);
		if (readTrailingTrivias) {
			tokenizer.tryReadTrailingTrivias();
		}

		return new GemlObject(
			tokenToAstToken(startToken),
			tokenToAstToken(identifierToken),
			new GemlNodeList(props),
			tokenToAstToken(endToken)
		);
	}

	parseArray(tokenizer: Tokenizer): GemlArray {
		tokenizer.tryReadLeadingTrivias();
		const startToken = tokenizer.expect(TokenKind.SquareBracketOpened)!;
		tokenizer.tryReadTrailingTrivias();

		const items = new Array<GemlValue>();

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const pos = tokenizer.pos;

			tokenizer.tryReadLeadingTrivias();
			const kind = tokenizer.peekKind();
			if (kind === undefined) {
				break;
			} else if (kind === TokenKind.SquareBracketClosed) {
				break;
			}
			tokenizer.goto(pos);

			const value = this.parseValue(tokenizer);
			items.push(value);
		}
		const endToken = tokenizer.expect(TokenKind.SquareBracketClosed);
		tokenizer.tryReadTrailingTrivias();

		return new GemlArray(
			tokenToAstToken(startToken),
			new GemlNodeList(items),
			tokenToAstToken(endToken)
		);
	}
}

function tokenToAstToken<T extends TokenKind>(token: Token<T>): GemlToken<T>;
function tokenToAstToken<T extends TokenKind>(
	token: Token<T> | undefined
): GemlToken<T> | undefined;
function tokenToAstToken<T extends TokenKind>(
	token: Token<T> | undefined
): GemlToken<T> | undefined {
	if (!token) {
		return undefined;
	}
	return new GemlToken(token.kind, token.text);
}
