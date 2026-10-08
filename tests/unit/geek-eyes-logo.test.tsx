import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GeekBrandPanel } from "../../src/features/auth/GeekEyesLogo";

describe("GuateGeeks branding", () => {
  it("puts the event first and shows GuateGeeks as its partner", () => {
    const { container } = render(<GeekBrandPanel />);
    const images = container.querySelectorAll("img");
    expect(images[0]).toHaveAttribute("src", "/brand/aws-community-day-guatemala.png");
    expect(images[1]).toHaveAttribute("src", "/brand/guategeeks.png");
    expect(screen.getByText("Una experiencia de GuateGeeks")).toBeInTheDocument();
  });
});
