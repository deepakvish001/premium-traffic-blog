import { describe, it, expect } from "vitest";
import { slugify, readingTimeMinutes } from "../slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("How To Fix A Leaky Faucet")).toBe("how-to-fix-a-leaky-faucet");
  });

  it("strips punctuation that isn't a hyphen", () => {
    expect(slugify("Top 10 Tips: Plumbing & Repairs!")).toBe("top-10-tips-plumbing-repairs");
  });

  it("collapses repeated whitespace/hyphens into a single hyphen", () => {
    expect(slugify("too   many    spaces")).toBe("too-many-spaces");
    expect(slugify("already--hyphenated---title")).toBe("already-hyphenated-title");
  });

  it("trims leading/trailing whitespace before processing", () => {
    expect(slugify("  padded title  ")).toBe("padded-title");
  });

  it("truncates to at most 80 characters", () => {
    const longTitle = "a".repeat(100);
    const result = slugify(longTitle);
    expect(result.length).toBeLessThanOrEqual(80);
    expect(result).toBe("a".repeat(80));
  });

  it("returns an empty string for input with nothing sluggable", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("readingTimeMinutes", () => {
  it("never returns less than 1 minute, even for empty content", () => {
    expect(readingTimeMinutes("")).toBe(1);
    expect(readingTimeMinutes("   ")).toBe(1);
    expect(readingTimeMinutes("one two three")).toBe(1);
  });

  it("estimates roughly words / 220, rounded", () => {
    const words = Array(440).fill("word").join(" "); // 440 words -> 2.0 min
    expect(readingTimeMinutes(words)).toBe(2);
  });

  it("rounds to the nearest minute rather than always flooring", () => {
    const words = Array(330).fill("word").join(" "); // 330/220 = 1.5 -> rounds to 2
    expect(readingTimeMinutes(words)).toBe(2);
  });
});
