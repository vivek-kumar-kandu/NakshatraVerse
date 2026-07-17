import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatMessage from "../src/components/assistant/ChatMessage.jsx";

// ─────────────────────────────────────────────────────────────────────────
// V4.5 Phase 4 (AI Report Chat) — ChatMessage structured-answer rendering.
// Confirms the new Short Answer / Detailed Explanation / Evidence /
// Confidence / Suggested Next Question layout renders when present, that
// a legacy plain-`content`-only message still renders exactly as before
// (V3.0 Phase 4 backward compatibility), and that Copy/Regenerate fire
// their callbacks.
// ─────────────────────────────────────────────────────────────────────────

describe("ChatMessage — Phase 4 structured answers", () => {
  it("renders a legacy plain-content assistant message unchanged (backward compatible)", () => {
    render(<ChatMessage role="assistant" content="Saturn governs discipline." timestamp={Date.now()} />);
    expect(screen.getByText("Saturn governs discipline.")).toBeInTheDocument();
  });

  it("renders Short Answer, Detailed Explanation, Evidence, Confidence, and Suggested Next Question", () => {
    render(
      <ChatMessage
        role="assistant"
        content="combined text"
        timestamp={Date.now()}
        shortAnswer="Saturn is your current Mahadasha lord."
        detailedExplanation="Saturn brings discipline and structure right now."
        evidence={["Current Mahadasha: Saturn until 2027-03-12"]}
        confidence={{ label: "High", score: 82 }}
        suggestedNextQuestion="What does my Antardasha indicate?"
      />
    );
    expect(screen.getByText("Saturn is your current Mahadasha lord.")).toBeInTheDocument();
    expect(screen.getByText("Saturn brings discipline and structure right now.")).toBeInTheDocument();
    expect(screen.getByText("Current Mahadasha: Saturn until 2027-03-12")).toBeInTheDocument();
    expect(screen.getByText(/Confidence: High \(82\/100\)/)).toBeInTheDocument();
    expect(screen.getByText(/What does my Antardasha indicate\?/)).toBeInTheDocument();
  });

  it("clicking the Suggested Next Question chip calls onAskSuggested with that question", async () => {
    const onAskSuggested = vi.fn();
    render(
      <ChatMessage
        role="assistant"
        content="x"
        shortAnswer="Short."
        detailedExplanation="Detail."
        suggestedNextQuestion="What about my career?"
        onAskSuggested={onAskSuggested}
      />
    );
    await userEvent.click(screen.getByText(/What about my career\?/));
    expect(onAskSuggested).toHaveBeenCalledWith("What about my career?");
  });

  it("Copy button calls onCopy and Regenerate button calls onRegenerate", async () => {
    const onCopy = vi.fn();
    const onRegenerate = vi.fn();
    render(<ChatMessage role="assistant" content="Some answer." onCopy={onCopy} onRegenerate={onRegenerate} />);
    await userEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(onCopy).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: /regenerate/i }));
    expect(onRegenerate).toHaveBeenCalled();
  });

  it("never renders Copy/Regenerate for a failed message", () => {
    render(<ChatMessage role="assistant" content="Error text" failed onCopy={vi.fn()} onRegenerate={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /regenerate/i })).not.toBeInTheDocument();
  });

  it("never renders Confidence when not provided (never invented)", () => {
    render(<ChatMessage role="assistant" content="x" shortAnswer="Short." detailedExplanation="Detail." />);
    expect(screen.queryByText(/Confidence:/)).not.toBeInTheDocument();
  });
});
