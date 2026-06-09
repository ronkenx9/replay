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

  it("renders the anchored run list, selected packet, and tamper proof", () => {
    render(<App />);

    expect(screen.getAllByText("REPLAY").length).toBeGreaterThan(1);
    expect(screen.getAllByText("MERIDIAN Rebalance").length).toBeGreaterThan(1);
    expect(screen.getAllByText("GASLIGHT Optimization").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Signals captured").length).toBeGreaterThan(1);
    expect(screen.getByText("Tamper proof")).toBeTruthy();
    expect(screen.getByText(/Sourcify exact match/i)).toBeTruthy();
  });

  it("exposes a tamper check control", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Run tamper check" })).toBeTruthy();
  });
});
