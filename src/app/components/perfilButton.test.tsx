import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PerfilButton from "./perfilButton";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("PerfilButton", () => {
  it("renderiza el botón con el icono de perfil", () => {
    render(<PerfilButton />);
    expect(screen.getByTitle("Ver perfil")).toBeInTheDocument();
    expect(screen.getByLabelText("perfil")).toBeInTheDocument();
  });

  it("redirige al perfil al hacer clic", () => {
    render(<PerfilButton />);
    const button = screen.getByTitle("Ver perfil");
    fireEvent.click(button);
  });
});