import { composeAsyncIterators } from "./async-iterator";

async function* range(a=0, b=5, sleepModifier=1) {
  for (let i=a; i<b; i++) {
    await new Promise(resolve => setTimeout(resolve, Math.random()*1000*sleepModifier));
    yield i;
  }
}

describe("composeAsyncIterators should works", () => {
  const results: number[] = [];
  beforeAll(async () => {
    const iterator = composeAsyncIterators([
      {
        iterator: range(0, 5, 0),
        filter: x => x % 2 === 0,
        map: x => x*10,
      },
      {
        iterator: range(1, 6, 1), // should be collected later than 1st iterator
        filter: x => x % 2 === 1,
        map: x => x*100,
      },
    ]);
    while(true) {
      const { done, value } = await iterator.next();
      if (done) return;
      results.push(value);
    }
  });

  it("merge, filter, map should works", () => {
    expect(results).toMatchObject([0, 20, 40, 100, 300, 500]);
  });
});
