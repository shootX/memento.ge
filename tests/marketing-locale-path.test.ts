import { describe, it, expect } from "vitest";
import {
  marketingLocaleFromPath,
  marketingPathForLocale,
  localeSwitcherHref,
} from "@/lib/marketing-locale-path";

describe("marketing locale paths", () => {
  it("detects locale from pathname", () => {
    expect(marketingLocaleFromPath("/en")).toBe("en");
    expect(marketingLocaleFromPath("/en/pricing")).toBe("en");
    expect(marketingLocaleFromPath("/ru/faq")).toBe("ru");
    expect(marketingLocaleFromPath("/pricing")).toBe("ka");
  });

  it("prefixes paths for en and ru", () => {
    expect(marketingPathForLocale("en", "/pricing")).toBe("/en/pricing");
    expect(marketingPathForLocale("ru", "/")).toBe("/ru");
    expect(marketingPathForLocale("ka", "/faq")).toBe("/faq");
  });

  it("preserves subpath when switching locale", () => {
    expect(localeSwitcherHref("/en/pricing", "/ru")).toBe("/ru/pricing");
    expect(localeSwitcherHref("/en/pricing", "/")).toBe("/pricing");
  });
});
