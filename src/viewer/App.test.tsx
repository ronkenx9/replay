import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App.js";

describe("REPLAY viewer", () => {
  it("renders the anchored run list, selected packet, and tamper proof", () => {
    render(<App />);

    expect(screen.getByText("REPLAY")).toBeTruthy();
    expect(screen.getAllByText("MERIDIAN Rebalance").length).toBeGreaterThan(1);
    expect(screen.getAllByText("GASLIGHT Optimization").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Signals captured").length).toBeGreaterThan(1);
    expect(screen.getByText("Tamper proof")).toBeTruthy();
    expect(screen.getByText(/Sourcify exact match/i)).toBeTruthy();
  });
});
