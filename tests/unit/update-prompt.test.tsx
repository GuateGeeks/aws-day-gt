import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpdateBanner } from "../../src/app/UpdateBanner";
import { scheduleUpdateChecks } from "../../src/app/sw-updates";

afterEach(cleanup);

function setup({ online = true, installing = null as ServiceWorker | null } = {}) {
  let tick: (() => void) | undefined; let onVisibility: (() => void) | undefined;
  const registration = { update: vi.fn(async () => undefined), installing } as unknown as ServiceWorkerRegistration;
  const doc = { visibilityState: "visible" as DocumentVisibilityState, addEventListener: vi.fn((_: string, fn: () => void) => { onVisibility = fn; }), removeEventListener: vi.fn() };
  const env = { setInterval: vi.fn((fn: () => void) => { tick = fn; return 7; }), clearInterval: vi.fn(), document: doc as unknown as Document, isOnline: () => online };
  const stop = scheduleUpdateChecks(registration, env, 1000);
  return { registration, env, doc, stop, tick: () => tick?.(), visible: () => onVisibility?.() };
}

describe("service worker update checks", () => {
  it("checks on an interval and when the app returns to the foreground", () => {
    const { registration, env, tick, visible } = setup();
    expect(env.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    tick(); visible();
    expect(registration.update).toHaveBeenCalledTimes(2);
  });

  it("skips checks while offline or while a worker is installing", () => {
    const offline = setup({ online: false }); offline.tick();
    expect(offline.registration.update).not.toHaveBeenCalled();
    const installing = setup({ installing: {} as ServiceWorker }); installing.tick();
    expect(installing.registration.update).not.toHaveBeenCalled();
  });

  it("cleans up timer and listener", () => {
    const { env, doc, stop } = setup(); stop();
    expect(env.clearInterval).toHaveBeenCalledWith(7);
    expect(doc.removeEventListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });
});

describe("UpdateBanner", () => {
  it("announces the new version and updates on demand", async () => {
    const onUpdate = vi.fn(async () => undefined); const onDismiss = vi.fn();
    render(<UpdateBanner onUpdate={onUpdate} onDismiss={onDismiss} />);
    expect(screen.getByRole("alertdialog", { name: /plumas nuevas/ })).toHaveAccessibleDescription(/nueva versión/);
    fireEvent.click(screen.getByRole("button", { name: /Actualizar/ }));
    await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
  });

  it("can be dismissed and recovers if the update fails", async () => {
    const onUpdate = vi.fn(async () => { throw new Error("boom"); }); const onDismiss = vi.fn();
    render(<UpdateBanner onUpdate={onUpdate} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /Actualizar/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Luego" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Luego" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
