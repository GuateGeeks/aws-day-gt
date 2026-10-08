import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CommunityLinks } from "../../src/features/profile/CommunityLinks";

afterEach(cleanup);

describe("GuateGeeks discovery", () => {
  it("offers Socrates, community networks and a discreet contact route", () => {
    render(<CommunityLinks />);
    expect(screen.getByRole("link", { name: /Conocer Sócrates/i })).toHaveAttribute("href", "https://guategeeks.com/socrates.app/#/");
    expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute("href", "https://www.facebook.com/GuateGeeksGT/");
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/guategeeks/");
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://gt.linkedin.com/company/guategeeks");
    expect(screen.getByRole("link", { name: /Hablemos/i })).toHaveAttribute("href", "mailto:info@guategeeks.com");
  });
});
