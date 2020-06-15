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
} from "./ast";
import { Tokenizer } from "./tokenizer";

export class Parser {
	parseDocument(tokenizer: Tokenizer): GemlDocument {
		this.parseObject(tokenizer);
		throw new Error("Not implemented");
	}

	parseMarkupStringContent(tokenizer: Tokenizer): GemlMarkupStringDocument {
		tokenizer.setState({ kind: "inMarkupString" });

		const items = new Array<GemlObject | GemlMarkupStringPart>();

		while (true) {
			const peeked = tokenizer.peekKind();
			if (peeked === TokenKind.CurlyBracketOpened) {
				tokenizer.setState({ kind: "default" });
				items.push(this.parseObject(tokenizer, false));
				tokenizer.setState({ kind: "inMarkupString" });
			} else if (peeked === TokenKind.Text) {
				const token = tokenizer.expect(TokenKind.Text)!;
				items.push(
					new GemlMarkupStringPart(
						new GemlNodeList([
							new GemlToken<TokenKind.Text>(
								token.kind,
								token.text
							),
						])
					)
				);
			} else if (peeked === undefined) {
				break;
			} else {
				throw new Error("Cannot happen");
			}
		}

		return new GemlMarkupStringDocument(new GemlNodeList(items));
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
		}

		throw new Error("Not supported");
	}

	parseMarkupString(tokenizer: Tokenizer): GemlMarkupString {
		tokenizer.tryReadLeadingTrivias();
		const start = tokenizer.expect(TokenKind.AngleBracketOpened)!;

		const oldState = tokenizer.state;
		tokenizer.setState({ kind: "inMarkupString" });
		const items = new Array<GemlObject | GemlMarkupStringPart>();

		while (true) {
			const peeked = tokenizer.peekKind();
			if (peeked === TokenKind.CurlyBracketOpened) {
				tokenizer.setState({ kind: "default" });
				items.push(this.parseObject(tokenizer, false));
				tokenizer.setState({ kind: "inMarkupString" });
			} else if (peeked === TokenKind.Text) {
				const token = tokenizer.expect(TokenKind.Text)!;
				items.push(
					new GemlMarkupStringPart(
						new GemlNodeList([
							new GemlToken<TokenKind.Text>(
								token.kind,
								token.text
							),
						])
					)
				);
			} else if (peeked === TokenKind.AngleBracketClosed) {
				break;
			} else if (peeked === undefined) {
				break;
			} else {
				throw new Error("Cannot happen");
			}
		}

		const endToken = tokenizer.expect(TokenKind.AngleBracketClosed);
		tokenizer.tryReadTrailingTrivias();

		tokenizer.setState(oldState);

		return new GemlMarkupString(
			new GemlToken(start.kind, start.text),
			new GemlNodeList(items),
			endToken ? new GemlToken(endToken.kind, endToken.text) : undefined
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
						name: new GemlToken(
							identifierToken.kind,
							identifierToken.text
						),
						colonToken: new GemlToken<TokenKind.Colon>(
							colonToken.kind,
							colonToken.text
						),
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
			new GemlToken(startToken.kind, startToken.text),
			identifierToken
				? new GemlToken(identifierToken.kind, identifierToken.text)
				: undefined,
			new GemlNodeList(props),
			endToken ? new GemlToken(endToken.kind, endToken.text) : undefined
		);
	}

	parseArray(tokenizer: Tokenizer): GemlArray {
		tokenizer.tryReadLeadingTrivias();
		tokenizer.expect(TokenKind.SquareBracketOpened);
		tokenizer.tryReadTrailingTrivias();

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const pos = tokenizer.pos;

			tokenizer.tryReadLeadingTrivias();
			const kind = tokenizer.peekKind();
			if (kind === undefined) {
				break;
			} else if (kind === TokenKind.SquareBracketClosed) {
				tokenizer.expect(TokenKind.SquareBracketClosed);
				tokenizer.tryReadTrailingTrivias();
				break;
			}
			tokenizer.goto(pos);

			this.parseValue(tokenizer);
		}
		throw new Error("Not implemented");
	}
}
