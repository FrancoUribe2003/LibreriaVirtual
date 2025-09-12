import { render, screen, fireEvent } from "@testing-library/react";
import LogoutButton from "./logoutButton";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true })
  ) as unknown as typeof fetch;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LogoutButton", () => {
  it("renderiza el botón de logout", () => {
    render(<LogoutButton />);
    expect(screen.getByTitle("Cerrar sesión")).toBeInTheDocument();
    expect(screen.getByLabelText("logout")).toBeInTheDocument();
  });

  it("hace logout y redirige al login al hacer clic", async () => {
    render(<LogoutButton />);
    const button = screen.getByTitle("Cerrar sesión");
    fireEvent.click(button);
    expect(global.fetch).toHaveBeenCalledWith("/api/logout", { method: "POST" });
  });
});