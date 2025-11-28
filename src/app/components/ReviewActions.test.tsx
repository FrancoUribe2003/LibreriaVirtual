import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ReviewActions from "./ReviewActions";

describe("ReviewActions", () => {
  it("muestra botones Editar y Eliminar inicialmente", () => {
    render(<ReviewActions reviewId="r1" initialRating={5} initialContent="Excelente libro" />);
    
    expect(screen.getByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Eliminar")).toBeInTheDocument();
  });

  it("cambia a modo edición al hacer click en Editar", () => {
    render(<ReviewActions reviewId="r1" initialRating={5} initialContent="Excelente libro" />);
    
    const editButton = screen.getByText("Editar");
    fireEvent.click(editButton);
    
    expect(screen.getByText("Guardar")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("Excelente libro");
  });

  it("permite cancelar la edición", () => {
    render(<ReviewActions reviewId="r1" initialRating={5} initialContent="Excelente libro" />);
    
    fireEvent.click(screen.getByText("Editar"));
    fireEvent.click(screen.getByText("Cancelar"));
    
    expect(screen.getByText("Editar")).toBeInTheDocument();
    expect(screen.queryByText("Guardar")).not.toBeInTheDocument();
  });

  it("muestra textarea y selector de rating en modo edición", () => {
    render(<ReviewActions reviewId="r1" initialRating={4} initialContent="Buen libro" />);
    
    fireEvent.click(screen.getByText("Editar"));
    
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    
    expect(textarea.value).toBe("Buen libro");
    expect(select.value).toBe("4");
  });
});
