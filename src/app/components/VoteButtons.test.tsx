import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import VoteButtons from "./VoteButtons";

describe("VoteButtons", () => {
  it("muestra el contador de votos", () => {
    render(<VoteButtons reviewId="r1" initialVotes={5} isOwnReview={false} />);
    
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("muestra los botones de voto cuando no es reseña propia", () => {
    render(<VoteButtons reviewId="r1" initialVotes={0} isOwnReview={false} />);
    
    expect(screen.getByText("👍 Útil")).toBeInTheDocument();
    expect(screen.getByText("👎 No útil")).toBeInTheDocument();
  });

  it("no muestra botones de voto para reseña propia", () => {
    render(<VoteButtons reviewId="r1" initialVotes={0} isOwnReview={true} />);
    
    expect(screen.queryByText("👍")).not.toBeInTheDocument();
    expect(screen.queryByText("👎")).not.toBeInTheDocument();
  });
});
