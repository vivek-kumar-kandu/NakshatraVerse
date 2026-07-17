import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPage from "../src/pages/LandingPage.jsx";

describe("LandingPage", () => {
  it("associates each label with its input via htmlFor/id (Priority 5.1 a11y fix)", () => {
    render(<LandingPage onSubmit={vi.fn()} />);
    // getByLabelText only succeeds if the <label> is correctly associated
    // with its <input> — this is a real regression test for the
    // accessibility fix (labels were previously unassociated siblings).
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time of Birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Place of Birth/i)).toBeInTheDocument();
  });

  it("shows validation errors and does not call onSubmit when fields are empty", () => {
    const onSubmit = vi.fn();
    render(<LandingPage onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /Generate My Kundli/i }));

    expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("marks invalid fields with aria-invalid and links the error via aria-describedby", () => {
    render(<LandingPage onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Generate My Kundli/i }));

    const nameInput = screen.getByLabelText(/Full Name/i);
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    const describedBy = nameInput.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy)).toHaveTextContent(/Full name is required/i);
  });

  it("calls onSubmit with the entered data once all fields are valid", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LandingPage onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Full Name/i), "Asha Verma");
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: "1990-05-14" } });
    fireEvent.change(screen.getByLabelText(/Time of Birth/i), { target: { value: "08:30" } });
    await user.type(screen.getByLabelText(/Place of Birth/i), "Lucknow");

    fireEvent.click(screen.getByRole("button", { name: /Generate My Kundli/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Asha Verma",
      dob: "1990-05-14",
      tob: "08:30",
      pob: "Lucknow",
    });
  });

  it("submits when Enter is pressed inside the form (native form behavior, Priority 5.1)", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LandingPage onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Full Name/i), "Asha Verma");
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: "1990-05-14" } });
    fireEvent.change(screen.getByLabelText(/Time of Birth/i), { target: { value: "08:30" } });
    await user.type(screen.getByLabelText(/Place of Birth/i), "Lucknow{enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
