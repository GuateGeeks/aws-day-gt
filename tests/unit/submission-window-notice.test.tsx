import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubmissionWindowNotice } from "../../src/features/submissions/SubmissionWindowNotice";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("submission deadline notice", () => {
  it("stays out of the way until the final 30 minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T15:29:59-06:00"));
    const { container } = render(<SubmissionWindowNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a compact reminder during the final 30 minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T15:45:00-06:00"));
    render(<SubmissionWindowNotice />);
    expect(screen.getByRole("status")).toHaveTextContent("Últimos 15 min para participar");
    expect(screen.getByRole("status")).toHaveTextContent("antes de las 4:00 p. m.");
  });

  it("shows the closed state after the deadline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T16:00:00-06:00"));
    render(<SubmissionWindowNotice />);
    expect(screen.getByRole("status")).toHaveTextContent("Entregas cerradas");
    expect(screen.getByRole("status")).toHaveTextContent("Puedes seguir consultando tus retos y progreso");
  });
});
