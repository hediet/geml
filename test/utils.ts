export function fromEntries<TKey extends string, TValue>(
	iterable: readonly (readonly [TKey, TValue])[]
): { [TKey2 in TKey]: TValue } {
	return [...iterable].reduce((obj, [key, val]) => {
		obj[key] = val;
		return obj;
	}, {} as { [TKey2 in TKey]: TValue });
}
