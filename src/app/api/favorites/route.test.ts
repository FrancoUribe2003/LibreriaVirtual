import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "./route";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockCollection = vi.fn((name: string) => ({
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
}));

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: mockCollection,
    }),
  }),
}));

vi.mock("jsonwebtoken");

describe("Favorites API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/favorites", () => {
    it("debe obtener los favoritos del usuario autenticado", async () => {
      const mockUserData = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        email: "user@example.com",
        favorites: ["book123", "book456"],
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "507f1f77bcf86cd799439011", email: "user@example.com" } as any);
      mockFindOne.mockResolvedValue(mockUserData);

      const request = new Request("http://localhost:3000/api/favorites", {
        headers: { Cookie: "session=valid-token" },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.favorites).toEqual(["book123", "book456"]);
    });

    it("debe rechazar solicitud sin autenticación", async () => {
      const request = new Request("http://localhost:3000/api/favorites");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("No autenticado");
    });

    it("debe devolver array vacío si no hay favoritos", async () => {
      const mockUserData = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        email: "user@example.com",
        favorites: [],
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "507f1f77bcf86cd799439011", email: "user@example.com" } as any);
      mockFindOne.mockResolvedValue(mockUserData);

      const request = new Request("http://localhost:3000/api/favorites", {
        headers: { Cookie: "session=valid-token" },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.favorites).toEqual([]);
    });
  });

  describe("POST /api/favorites", () => {
    it("debe agregar un libro a favoritos", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "507f1f77bcf86cd799439011", email: "user@example.com" } as any);
      mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });

      const request = new Request("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({ bookId: "book123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockUpdateOne).toHaveBeenCalled();
    });

    it("debe rechazar solicitud sin autenticación", async () => {
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
      vi.mocked(jwt.verify).mockReturnValue({ userId: "507f1f77bcf86cd799439011", email: "user@example.com" } as any);

      const request = new Request("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("bookId");
    });
  });

  describe("DELETE /api/favorites", () => {
    it("debe eliminar un libro de favoritos", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "507f1f77bcf86cd799439011", email: "user@example.com" } as any);
      mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });

      const request = new Request("http://localhost:3000/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({ bookId: "book123" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockUpdateOne).toHaveBeenCalled();
    });

    it("debe rechazar eliminación sin autenticación", async () => {
      const request = new Request("http://localhost:3000/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: "book123" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar solicitud sin bookId", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "507f1f77bcf86cd799439011", email: "user@example.com" } as any);

      const request = new Request("http://localhost:3000/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({}),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("bookId");
    });
  });
});
