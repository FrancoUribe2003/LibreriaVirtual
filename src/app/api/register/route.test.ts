import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import bcrypt from "bcryptjs";

const mockFindOne = vi.fn();
const mockInsertOne = vi.fn();
const mockCollection = vi.fn(() => ({
  findOne: mockFindOne,
  insertOne: mockInsertOne,
}));

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: mockCollection,
    }),
  }),
}));

vi.mock("bcryptjs");

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe registrar un nuevo usuario con datos válidos", async () => {
    mockFindOne.mockResolvedValue(null); // No existe usuario previo
    mockInsertOne.mockResolvedValue({ insertedId: "123" });
    vi.mocked(bcrypt.hash).mockResolvedValue("hashedpassword" as never);

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

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.userId).toBeDefined();
    expect(mockInsertOne).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
  });

  it("debe rechazar registro con email duplicado", async () => {
    const existingUser = {
      _id: "456",
      email: "existing@example.com",
    };

    mockFindOne.mockResolvedValue(existingUser);

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
    expect(mockInsertOne).not.toHaveBeenCalled();
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
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
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

    try {
      await POST(request);
    } catch (error: any) {
      expect(error.message).toContain("JSON");
    }
  });

  it("debe manejar errores de base de datos", async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockRejectedValue(new Error("Database error"));
    vi.mocked(bcrypt.hash).mockResolvedValue("hashedpassword" as never);

    const request = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Franco Uribe",
        email: "franco@example.com",
        password: "password123",
      }),
    });

    try {
      await POST(request);
    } catch (error: any) {
      expect(error.message).toContain("Database error");
    }
  });
});
