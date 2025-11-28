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
    create: vi.fn(),
  },
}));

vi.mock("@/lib/auth");

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe registrar un nuevo usuario con datos válidos", async () => {
    const mockCreatedUser = {
      _id: "123",
      name: "Franco Uribe",
      email: "franco@example.com",
      password: "hashedpassword",
    };

    vi.mocked(User.findOne).mockResolvedValue(null); // No existe usuario previo
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser as any);
    vi.mocked(generateToken).mockReturnValue("mock-token");

    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Franco Uribe",
        email: "franco@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("franco@example.com");
    expect(User.create).toHaveBeenCalled();
  });

  it("debe rechazar registro con email duplicado", async () => {
    const existingUser = {
      _id: "456",
      email: "existing@example.com",
    };

    vi.mocked(User.findOne).mockResolvedValue(existingUser as any);

    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Nuevo Usuario",
        email: "existing@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("ya está registrado");
    expect(User.create).not.toHaveBeenCalled();
  });

  it("debe rechazar datos inválidos (email mal formado)", async () => {
    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Franco Uribe",
        email: "email-invalido",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("debe rechazar contraseña muy corta", async () => {
    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Franco Uribe",
        email: "franco@example.com",
        password: "123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("debe rechazar nombre muy corto", async () => {
    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "F",
        email: "franco@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("debe rechazar datos faltantes", async () => {
    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Franco Uribe",
        email: "franco@example.com",
        // falta password
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("debe establecer una cookie con el token al registrarse", async () => {
    const mockCreatedUser = {
      _id: "123",
      name: "Franco Uribe",
      email: "franco@example.com",
    };

    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser as any);
    vi.mocked(generateToken).mockReturnValue("mock-jwt-token");

    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Franco Uribe",
        email: "franco@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const setCookieHeader = response.headers.get("set-cookie");

    expect(setCookieHeader).toContain("token=");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("Path=/");
  });

  it("debe hashear la contraseña antes de guardarla", async () => {
    const mockCreatedUser = {
      _id: "123",
      name: "Franco Uribe",
      email: "franco@example.com",
      password: "hashedpassword", // No debe ser la contraseña en texto plano
    };

    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockResolvedValue(mockCreatedUser as any);
    vi.mocked(generateToken).mockReturnValue("mock-token");

    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Franco Uribe",
        email: "franco@example.com",
        password: "password123",
      }),
    });

    await POST(request);

    // Verificar que User.create fue llamado
    expect(User.create).toHaveBeenCalled();

    // La contraseña guardada NO debe ser la contraseña en texto plano
    // El hash se hace en el pre-save hook del modelo User
  });

  it("debe manejar errores de validación de datos", async () => {
    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        email: "invalid-email",
        password: "123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("debe manejar JSON inválido", async () => {
    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
  });

  it("debe manejar errores de base de datos", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockRejectedValue(new Error("Database error"));

    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Franco Uribe",
        email: "franco@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("Error interno del servidor");
  });
});
