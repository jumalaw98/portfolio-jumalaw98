import { describe, expect, it } from "vitest";

import { mdxToPlainText } from "./strip-jsx";

describe("mdxToPlainText", () => {
  it("unwraps markdown links with balanced parentheses in the destination", () => {
    const mdx =
      "Read the [Wikipedia example](https://en.wikipedia.org/wiki/Function_(mathematics)) today.";

    expect(mdxToPlainText(mdx)).toBe("Read the Wikipedia example today.");
  });
});
