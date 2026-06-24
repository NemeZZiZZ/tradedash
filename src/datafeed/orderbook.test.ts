import { describe, it, expect } from "vitest";
import { OrderBookState } from "./orderbook";

describe("OrderBookState", () => {
  it("applies a snapshot and returns sorted top levels", () => {
    const ob = new OrderBookState();
    ob.applySnapshot(
      [["100", "1"], ["99", "2"], ["101", "3"]], // bids (unsorted)
      [["102", "1"], ["104", "2"], ["103", "3"]], // asks (unsorted)
    );
    const { bids, asks } = ob.top(2);
    expect(bids).toEqual([[101, 3], [100, 1]]); // desc
    expect(asks).toEqual([[102, 1], [103, 3]]); // asc
  });

  it("applies deltas: updates size and removes on zero", () => {
    const ob = new OrderBookState();
    ob.applySnapshot([["100", "1"]], [["101", "1"]]);
    ob.applyDelta([["100", "5"]], [["101", "0"]]); // update bid, remove ask
    const { bids, asks } = ob.top(5);
    expect(bids).toEqual([[100, 5]]);
    expect(asks).toEqual([]);
  });

  it("ignores non-finite prices", () => {
    const ob = new OrderBookState();
    ob.applySnapshot([["abc", "1"], ["100", "1"]], []);
    expect(ob.top(5).bids).toEqual([[100, 1]]);
  });
});
