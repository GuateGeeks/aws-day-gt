import { describe, expect, it } from "vitest";
import { router } from "../../src/app/router";

describe("public live route", () => {
  it("registers /live outside the authenticated route branch", () => {
    const publicLiveRoute = router.routes.find((route) => route.path === "/live");
    const protectedBranch = router.routes.find((route) => !route.path && route.children);

    expect(publicLiveRoute).toBeDefined();
    expect(protectedBranch?.children?.some((route) => route.path === "/live")).toBe(false);
  });
});
