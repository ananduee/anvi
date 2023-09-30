import { Atom, atom } from "jotai";
import { Pair } from "./models";

export function readWriteAsyncAtom<R>(
  defaultValAtom: Atom<Promise<Pair<Date, R>>>,
  atomName: string
) {
  process.env.NODE_ENV !== "production" &&
    (defaultValAtom.debugLabel = `default${atomName}`);
  let overrideAtom = atom<Pair<Date, R> | null>(null);
  process.env.NODE_ENV !== "production" &&
    (overrideAtom.debugLabel = `override${atomName}`);
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
  process.env.NODE_ENV !== "production" &&
    (smartValueAtom.debugLabel = `smart${atomName}`);
  return new Pair(smartValueAtom, overrideAtom);
}
