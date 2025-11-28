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
    expect(screen.getByText("Cerrar Sesión")).toBeInTheDocument();
  });

  it("hace logout y redirige al login al hacer clic", async () => {
    render(<LogoutButton />);
    const button = screen.getByText("Cerrar Sesión");
    fireEvent.click(button);
    expect(global.fetch).toHaveBeenCalledWith("/api/logout", { method: "POST" });
  });
});