import { describe, expect, it } from "vitest";
import { seededShuffle } from "@/lib/seeded-shuffle";

describe("seededShuffle", () => {
    it("orders items by independent draws and remains deterministic", () => {
        const items = ["a", "b", "c", "d"];

        expect(seededShuffle(items, "stable-test")).toEqual(["b", "c", "a", "d"]);
        expect(seededShuffle(items, "stable-test")).toEqual(["b", "c", "a", "d"]);
        expect(items).toEqual(["a", "b", "c", "d"]);
    });
});