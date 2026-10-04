import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, ProgressBar, StatusNotice } from "../../src/design-system/components";

describe("design system", () => {
  it("renders an accessible tactile button", () => {
    render(<Button>Participar</Button>);
    expect(screen.getByRole("button", { name: "Participar" })).toHaveClass("ds-button");
  });

  it("labels progress for assistive technology", () => {
    render(<ProgressBar value={65} max={100} label="Progreso de misiones" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "65");
  });

  it("announces status without stealing focus", () => {
    render(<StatusNotice>Guardado en este dispositivo</StatusNotice>);
    expect(screen.getByRole("status")).toHaveTextContent("Guardado en este dispositivo");
  });
});
