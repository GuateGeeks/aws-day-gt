import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionDate } from "../../shared/agenda";
import { AgendaReminderCenter, BrowserReminderButton } from "../../src/features/companion/AgendaReminderCenter";

afterEach(() => { cleanup(); window.sessionStorage.clear(); vi.unstubAllGlobals(); });

describe("agenda reminder", () => {
  it("shows the next block at five minutes and does not repeat after dismissal", () => {
    const { rerender } = render(<AgendaReminderCenter now={sessionDate("08:24")} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    rerender(<AgendaReminderCenter now={sessionDate("08:25")} />);
    expect(screen.getByRole("status")).toHaveTextContent("08:30");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    rerender(<AgendaReminderCenter now={sessionDate("08:26")} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("agenda-reminder:2026-10-10-08:30")).toBe("seen");
  });

  it("requests browser notification permission only after the participant clicks", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    render(<BrowserReminderButton />);
    expect(requestPermission).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Activar avisos del navegador" }));
    await waitFor(() => expect(requestPermission).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "Avisos del navegador activados" })).toBeDisabled();
  });
});
