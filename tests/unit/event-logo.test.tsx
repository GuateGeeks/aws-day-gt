import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventLogo } from "../../src/features/auth/EventLogo";

describe("EventLogo", () => {
  it("renders the official logo with alt text and intrinsic size to avoid layout shift", () => {
    render(<EventLogo className="event-logo--compact" />);
    const logo = screen.getByRole("img", { name: "AWS Community Day Guatemala" });
    expect(logo).toHaveAttribute("src", "/brand/aws-community-day-guatemala.png");
    expect(logo).toHaveAttribute("width", "1536");
    expect(logo.parentElement).toHaveClass("event-logo", "event-logo--compact");
  });
});
