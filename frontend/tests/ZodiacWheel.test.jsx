import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ZodiacWheel from "../src/components/common/ZodiacWheel.jsx";

describe("ZodiacWheel (Priority 5.1 responsive fix)", () => {
  it("does not use fixed pixel width/height attributes (regression guard against the mobile overflow bug)", () => {
    const { container } = render(<ZodiacWheel lagna="Taurus" planetary={{}} />);
    const svg = container.querySelector("svg");
    // Previously: width={260} height={260} — fixed pixels that could not
    // shrink below 260px, forcing horizontal scroll on narrow phones.
    expect(svg.getAttribute("width")).toBe("100%");
    expect(svg.getAttribute("height")).toBe("100%");
    // The original 260x260 coordinate system is preserved via viewBox, so
    // all the internal geometry (circles/text positions) is untouched.
    expect(svg.getAttribute("viewBox")).toBe("0 0 260 260");
  });

  it("caps at the original 260px size on larger screens via maxWidth", () => {
    const { container } = render(<ZodiacWheel lagna="Taurus" planetary={{}} />);
    const svg = container.querySelector("svg");
    expect(svg.style.maxWidth).toBe("260px");
  });

  it("exposes an accessible label naming the lagna", () => {
    const { container } = render(<ZodiacWheel lagna="Leo" planetary={{}} />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toMatch(/Leo/);
  });
});
