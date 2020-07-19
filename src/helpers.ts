/*export function format(node: GemlNode): void {

}*/
/*
export function parseGemlDocument(text: string): GemlDocument {

}
*/

import { GemlMarkupStringDocument, GemlDocument } from "./ast";
import { Parser } from "./Parser";
import { Tokenizer } from "./tokenizer";

export function parseGemlMarkupString(text: string): GemlMarkupStringDocument {
	const parser = new Parser();
	const tokenizer = new Tokenizer(text);
	const result = parser.parseMarkupStringDocument(tokenizer);
	return result;
}

export function parseGeml(text: string): GemlDocument {
	const parser = new Parser();
	const tokenizer = new Tokenizer(text);
	const result = parser.parseDocument(tokenizer);
	return result;
}
