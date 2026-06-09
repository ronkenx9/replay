import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App.js";

describe("REPLAY viewer", () => {
  afterEach(() => {
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
