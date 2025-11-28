import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import User from "@/lib/models/User";
import { generateToken } from "@/lib/auth";

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: vi.fn(),
    }),
  }),
}));

vi.mock("@/lib/models/User", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock("@/lib/auth");

describe("POST /api/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe iniciar sesión con credenciales válidas", async () => {
    const mockUser = {
      _id: "123",
      email: "test@example.com",
      name: "Test User",
      comparePassword: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
    vi.mocked(generateToken).mockReturnValue("mock-token");

    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("test@example.com");
    expect(mockUser.comparePassword).toHaveBeenCalledWith("password123");
  });

  it("debe rechazar credenciales con email incorrecto", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "noexiste@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("Credenciales inválidas");
  });

  it("debe rechazar credenciales con contraseña incorrecta", async () => {
    const mockUser = {
      _id: "123",
      email: "test@example.com",
      comparePassword: vi.fn().mockResolvedValue(false),
    };

    vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.ok).toBe(false);
    expect(mockUser.comparePassword).toHaveBeenCalledWith("wrongpassword");
  });

  it("debe rechazar datos inválidos (email mal formado)", async () => {
    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "email-invalido",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("Datos inválidos");
  });

  it("debe rechazar datos faltantes", async () => {
    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        // falta password
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("debe establecer una cookie con el token", async () => {
    const mockUser = {
      _id: "123",
      email: "test@example.com",
      name: "Test User",
      comparePassword: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
    vi.mocked(generateToken).mockReturnValue("mock-jwt-token");

    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const setCookieHeader = response.headers.get("set-cookie");

    expect(setCookieHeader).toContain("token=");
    expect(setCookieHeader).toContain("mock-jwt-token");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("Path=/");
  });

  it("debe manejar errores del servidor", async () => {
    vi.mocked(User.findOne).mockRejectedValue(new Error("Database error"));

    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("Error interno del servidor");
  });

  it("debe manejar JSON inválido", async () => {
    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
  });

  it("debe rechazar email vacío", async () => {
    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("debe rechazar contraseña vacía", async () => {
    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });
});
