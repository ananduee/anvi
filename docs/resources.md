### Design

1. How to create trello like layout in tailwind. https://codepen.io/Govind_Singh/pen/OJPPaNo
2. https://plane.so/ alternative to jira has kanban like interface.
3. Rust markdown parser https://github.com/wooorm/markdown-rs

### Jotai

Use below pattern when we want to trigger suspend on data load.

```javascript
const amazingAtomRefresher = atom(0);

const amazingAtom = atom(async (get) => {
  console.log("invoking async");
  get(amazingAtomRefresher);
  return new Promise<number>((resolve) => {
    setTimeout(() => resolve(2), 1000);
  })
});

const Counter = () => {
  const [v, setV] = useAtom(amazingAtom);
  const refereshV = useAtomCallback(useCallback((get, set) => {
    set(amazingAtomRefresher, get(amazingAtomRefresher) + 1)
  }, []))
  return (
    <>
      <p>{v}</p>
      <button onClick={refereshV}>Write</button>
    </>
  );
};
```

Use below pattern when we don't want to trigger suspend on data refresh.

```javascript
const amazingAtom = atomWithDefault(async (get) => {
  console.log("invoking async");
  get(amazingAtomRefresher);
  return new Promise<number>((resolve) => {
    setTimeout(() => resolve(2), 1000);
  })
});

const amazingAtomRefresher = atom(null, async (get, set, args: string) => {
  await new Promise((resolve) => setTimeout(() => resolve(null), 1000));
  set(amazingAtom, 3)
});

 

const Counter = () => {
  const [v, setV] = useAtom(amazingAtom);
  const [_, xrefreshV] = useAtom(amazingAtomRefresher);
  const refereshV = useCallback(() => {
    xrefreshV()
  }, [xrefreshV])
  return (
    <>
      <p>{v}</p>
      <button onClick={refereshV}>Write</button>
    </>
  );
};
```
How to suspend during write

https://github.com/pmndrs/jotai/discussions/1195

Basically we can set value of atom as Promise which will trigger suspend.
