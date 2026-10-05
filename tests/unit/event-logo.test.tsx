import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventLogo } from "../../src/features/auth/EventLogo";

describe("EventLogo", () => {
  it("renders the official logo with alt text and intrinsic size to avoid layout shift", () => {
    render(<EventLogo className="event-logo--compact" />);
    const logo = screen.getByRole("img", { name: "AWS Community Day Guatemala 2026" });
    expect(logo).toHaveAttribute("src", "/brand/aws-cd-2026-blanco.png");
    expect(logo).toHaveAttribute("width", "1465");
    expect(logo.parentElement).toHaveClass("event-logo", "event-logo--compact");
  });
});
