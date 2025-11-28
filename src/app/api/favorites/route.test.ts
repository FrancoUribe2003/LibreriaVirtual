import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "./route";
import User from "@/lib/models/User";
import { getUserFromToken } from "@/lib/auth";

// Mock de las dependencias
vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: vi.fn(),
    }),
  }),
}));

vi.mock("@/lib/models/User", () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock("@/lib/auth");

describe("Favorites API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/favorites", () => {
    it("debe obtener los favoritos del usuario autenticado", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };

      const mockUserData = {
        _id: "user123",
        email: "user@example.com",
        favorites: ["book123", "book456"],
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(User.findById).mockResolvedValue(mockUserData as any);

      const request = new Request("http://localhost:3000/api/favorites", {
        headers: { Cookie: "token=valid-token" },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.favorites).toEqual(["book123", "book456"]);
      expect(User.findById).toHaveBeenCalledWith("user123");
    });

    it("debe rechazar solicitud sin autenticación", async () => {
      vi.mocked(getUserFromToken).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/favorites");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("autenticado");
    });

    it("debe manejar usuario no encontrado", async () => {
      const mockUser = { userId: "user999", email: "user@example.com" };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(User.findById).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/favorites");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("Usuario no encontrado");
    });

    it("debe devolver array vacío si no hay favoritos", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockUserData = {
        _id: "user123",
        email: "user@example.com",
        favorites: [],
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(User.findById).mockResolvedValue(mockUserData as any);

      const request = new Request("http://localhost:3000/api/favorites");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.favorites).toEqual([]);
    });
  });

  describe("POST /api/favorites", () => {
    it("debe agregar un libro a favoritos", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockUserData = {
        _id: "user123",
        email: "user@example.com",
        favorites: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(User.findById).mockResolvedValue(mockUserData as any);

      const request = new Request("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({ bookId: "book123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockUserData.favorites).toContain("book123");
      expect(mockUserData.save).toHaveBeenCalled();
    });

    it("debe rechazar agregar favorito duplicado", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockUserData = {
        _id: "user123",
        email: "user@example.com",
        favorites: ["book123"], // Ya existe
        save: vi.fn(),
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(User.findById).mockResolvedValue(mockUserData as any);

      const request = new Request("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({ bookId: "book123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      // El libro se removió (toggle)
      expect(mockUserData.favorites).not.toContain("book123");
      expect(mockUserData.save).toHaveBeenCalled();
    });

    it("debe rechazar solicitud sin autenticación", async () => {
      vi.mocked(getUserFromToken).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: "book123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar datos faltantes (sin bookId)", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);

      const request = new Request("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("bookId");
    });

    it("debe manejar usuario no encontrado", async () => {
      const mockUser = { userId: "user999", email: "user@example.com" };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(User.findById).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({ bookId: "book123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("Usuario no encontrado");
    });
  });

  describe("DELETE /api/favorites", () => {
    it("debe eliminar un libro de favoritos", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockUserData = {
        _id: "user123",
        email: "user@example.com",
        favorites: ["book123", "book456"],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(User.findById).mockResolvedValue(mockUserData as any);

      const url = new URL("http://localhost:3000/api/favorites?bookId=book123");
      const request = new Request(url, {
        method: "DELETE",
        headers: { Cookie: "token=valid-token" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockUserData.favorites).not.toContain("book123");
      expect(mockUserData.favorites).toContain("book456");
      expect(mockUserData.save).toHaveBeenCalled();
    });

    it("debe rechazar eliminación sin autenticación", async () => {
      vi.mocked(getUserFromToken).mockResolvedValue(null);

      const url = new URL("http://localhost:3000/api/favorites?bookId=book123");
      const request = new Request(url, { method: "DELETE" });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar solicitud sin bookId", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);

      const url = new URL("http://localhost:3000/api/favorites");
      const request = new Request(url, {
        method: "DELETE",
        headers: { Cookie: "token=valid-token" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("bookId");
    });

    it("debe manejar usuario no encontrado", async () => {
      const mockUser = { userId: "user999", email: "user@example.com" };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(User.findById).mockResolvedValue(null);

      const url = new URL("http://localhost:3000/api/favorites?bookId=book123");
      const request = new Request(url, {
        method: "DELETE",
        headers: { Cookie: "token=valid-token" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("Usuario no encontrado");
    });

    it("debe manejar eliminación de favorito inexistente", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockUserData = {
        _id: "user123",
        email: "user@example.com",
        favorites: ["book456"], // book123 no está
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(User.findById).mockResolvedValue(mockUserData as any);

      const url = new URL("http://localhost:3000/api/favorites?bookId=book123");
      const request = new Request(url, {
        method: "DELETE",
        headers: { Cookie: "token=valid-token" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      // Debería funcionar aunque no exista (idempotente)
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockUserData.save).toHaveBeenCalled();
    });
  });
});
