import { jsx as _jsx } from "react/jsx-runtime";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";
describe("REPLAY viewer", () => {
    beforeEach(() => {
        // Hermetic: never let the test hit a live local API server (port 4174).
        // The component's offline fallback (static runs) is the unit under test.
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline test")));
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        cleanup();
    });
    it("renders the anchored run list, selected packet, and tamper proof", async () => {
        render(_jsx(App, {}));
        expect((await screen.findAllByText("REPLAY")).length).toBeGreaterThanOrEqual(1);
        expect((await screen.findAllByText("MERIDIAN Rebalance")).length).toBeGreaterThanOrEqual(1);
        expect((await screen.findAllByText("GASLIGHT Optimization")).length).toBeGreaterThanOrEqual(1);
        expect((await screen.findAllByText("Signals captured")).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Packet Verified/i)).toBeTruthy();
        expect(screen.getByRole("button", { name: /Live Verify/i })).toBeTruthy();
    });
    it("exposes a tamper check control", () => {
        render(_jsx(App, {}));
        expect(screen.getByRole("button", { name: "Run tamper check" })).toBeTruthy();
    });
});
//# sourceMappingURL=App.test.js.map