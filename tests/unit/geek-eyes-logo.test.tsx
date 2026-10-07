import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GeekBrandPanel } from "../../src/features/auth/GeekEyesLogo";

describe("GuateGeeks branding", () => {
  it("uses the original eyes image without stretching it in the welcome panel", () => {
    const { container } = render(<GeekBrandPanel />);
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", "/brand/geek-eyes.png");
    expect(image).toHaveAttribute("width", "512");
    expect(image).toHaveAttribute("height", "282");
    expect(screen.getByText("Guate")).toBeInTheDocument();
    expect(screen.getByText("Geeks")).toBeInTheDocument();
  });
});
