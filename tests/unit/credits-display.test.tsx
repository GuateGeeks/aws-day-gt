import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreditAmount, formatCredits } from "../../src/design-system/credits";

describe("credit display", () => {
  it("uses singular and plural Spanish labels", () => {
    expect(formatCredits(1)).toBe("1 crédito");
    expect(formatCredits(2)).toBe("2 créditos");
  });

  it("shows a signed amount with a decorative coin", () => {
    render(<CreditAmount value={350} signed />);
    expect(screen.getByText("+350 créditos")).toBeInTheDocument();
    expect(screen.getByText("✦")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows negative balances without changing their value", () => {
    expect(formatCredits(-20)).toBe("−20 créditos");
  });
});
