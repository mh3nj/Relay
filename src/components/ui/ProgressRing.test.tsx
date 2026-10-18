import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressRing } from "@/components/ui/ProgressRing";

describe("ProgressRing", () => {
  it("renders without crashing at 0%", () => {
    render(<ProgressRing percent={0} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("clamps and displays a rounded percentage label", () => {
    render(<ProgressRing percent={73.6} />);
    expect(screen.getByText("74%")).toBeInTheDocument();
  });

  it("handles out-of-range percentages without crashing", () => {
    expect(() => render(<ProgressRing percent={150} />)).not.toThrow();
    expect(() => render(<ProgressRing percent={-20} />)).not.toThrow();
  });
});
