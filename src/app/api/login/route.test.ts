import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import bcrypt from "bcryptjs";

const mockFindOne = vi.fn();
const mockCollection = vi.fn(() => ({
  findOne: mockFindOne,
}));

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: mockCollection,
    }),
  }),
}));

vi.mock("bcryptjs");

describe("POST /api/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe iniciar sesión con credenciales válidas", async () => {
    const mockUser = {
      _id: "123",
      email: "test@example.com",
      name: "Test User",
      password: "hashedpassword",
    };

    mockFindOne.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

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
    expect(data.userId).toBeDefined();
    expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedpassword");
  });

  it("debe rechazar credenciales con email incorrecto", async () => {
    mockFindOne.mockResolvedValue(null);

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
    expect(data.error).toContain("Usuario no encontrado");
  });

  it("debe rechazar credenciales con contraseña incorrecta", async () => {
    const mockUser = {
      _id: "123",
      email: "test@example.com",
      password: "hashedpassword",
    };

    mockFindOne.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

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
    expect(data.error).toContain("Contraseña incorrecta");
    expect(bcrypt.compare).toHaveBeenCalledWith("wrongpassword", "hashedpassword");
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
      password: "hashedpassword",
    };

    mockFindOne.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

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

    expect(setCookieHeader).toContain("session=");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("Path=/");
  });

  it("debe manejar errores del servidor", async () => {
    mockFindOne.mockRejectedValue(new Error("Database error"));

    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    try {
      await POST(request);
    } catch (error: any) {
      expect(error.message).toContain("Database error");
    }
  });

  it("debe manejar JSON inválido", async () => {
    const request = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json",
    });

    try {
      await POST(request);
    } catch (error: any) {
      expect(error.message).toContain("JSON");
    }
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
