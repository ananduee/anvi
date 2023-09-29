import { Atom, atom } from "jotai";
import { Pair } from "./models";

export function readWriteAsyncAtom<R>(defaultValAtom: Atom<Promise<Pair<Date, R>>>) {
  let overrideAtom = atom<Pair<Date, R> | null>(null);
  let smartValueAtom = atom(async (get) => {
    let defaultVal = await get(defaultValAtom);
    let overridenVal = get(overrideAtom);
    // Use the latest value.
    if (overridenVal == null || defaultVal.left() > overridenVal.left()) {
      return defaultVal.right();
    } else {
      return overridenVal.right();
    }
  });
  return new Pair(smartValueAtom, overrideAtom);
}
