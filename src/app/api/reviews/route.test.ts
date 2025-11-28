import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PATCH, DELETE } from "./route";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const mockFind = vi.fn();
const mockInsertOne = vi.fn();
const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockDeleteOne = vi.fn();
const mockCollection = vi.fn((name: string) => ({
  find: mockFind,
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
  deleteOne: mockDeleteOne,
}));

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: mockCollection,
    }),
  }),
}));

vi.mock("jsonwebtoken");

describe("Reviews API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/reviews", () => {
    it("debe obtener todas las reseñas de un libro", async () => {
      const mockReviews = [
        {
          _id: "1",
          bookId: "book123",
          userId: "user1",
          userName: "User 1",
          content: "Excelente libro",
          rating: 5,
        },
        {
          _id: "2",
          bookId: "book123",
          userId: "user2",
          userName: "User 2",
          content: "Muy bueno",
          rating: 4,
        },
      ];

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockReviews),
        }),
      });

      const url = new URL("http://localhost:3000/api/reviews?bookId=book123");
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.reviews).toHaveLength(2);
    });

    it("debe rechazar solicitud sin bookId", async () => {
      const url = new URL("http://localhost:3000/api/reviews");
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("Falta parámetro");
    });

    it("debe devolver array vacío si no hay reseñas", async () => {
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      });

      const url = new URL("http://localhost:3000/api/reviews?bookId=book999");
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.reviews).toEqual([]);
    });
  });

  describe("POST /api/reviews", () => {
    it("debe crear una nueva reseña con datos válidos", async () => {
      const mockUser = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        name: "Test User",
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "507f1f77bcf86cd799439011", email: "user@example.com" } as any);
      mockFindOne.mockResolvedValue(mockUser);
      mockInsertOne.mockResolvedValue({ insertedId: "review123" });

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({
          bookId: "book123",
          text: "Esta es una reseña excelente de este libro.",
          rating: 5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.review).toBeDefined();
      expect(mockInsertOne).toHaveBeenCalled();
    });

    it("debe rechazar reseña sin autenticación", async () => {
      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: "book123",
          text: "Contenido de la reseña",
          rating: 5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("No autenticado");
    });

    it("debe rechazar datos inválidos (contenido muy corto)", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({
          bookId: "book123",
          text: "C", // Contenido muy corto
          rating: 5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar rating fuera de rango", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({
          bookId: "book123",
          text: "Esta es una reseña con suficiente contenido.",
          rating: 6, // Rating inválido
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar datos faltantes (sin bookId)", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({
          text: "Contenido suficiente para la reseña.",
          rating: 5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });
  });

  describe("PATCH /api/reviews", () => {
    it("debe actualizar una reseña propia", async () => {
      const mockReview = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        bookId: "book123",
        userId: "user123",
        content: "Contenido original",
        rating: 3,
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      mockFindOne.mockResolvedValue(mockReview);
      mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({
          reviewId: "507f1f77bcf86cd799439011",
          text: "Contenido actualizado con más detalles sobre el libro.",
          rating: 5,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockUpdateOne).toHaveBeenCalled();
    });

    it("debe rechazar actualización de reseña ajena", async () => {
      const mockReview = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        userId: "otherUser", // Reseña de otro usuario
        content: "Contenido original",
        rating: 3,
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      mockFindOne.mockResolvedValue(mockReview);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({
          reviewId: "507f1f77bcf86cd799439011",
          text: "Intento de actualizar reseña ajena.",
          rating: 5,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("No autorizado");
    });

    it("debe rechazar actualización sin autenticación", async () => {
      const request = new Request("http://localhost:3000/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: "review123",
          text: "Contenido actualizado",
          rating: 5,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });
  });

  describe("DELETE /api/reviews", () => {
    it("debe eliminar una reseña propia", async () => {
      const mockReview = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        userId: "user123",
        content: "Mi reseña",
        rating: 5,
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      mockFindOne.mockResolvedValue(mockReview);
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({ reviewId: "507f1f77bcf86cd799439011" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockDeleteOne).toHaveBeenCalled();
    });

    it("debe rechazar eliminación de reseña ajena", async () => {
      const mockReview = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        userId: "otherUser", // Reseña de otro usuario
        content: "Reseña ajena",
        rating: 4,
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      mockFindOne.mockResolvedValue(mockReview);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Cookie: "session=valid-token" },
        body: JSON.stringify({ reviewId: "507f1f77bcf86cd799439011" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("No autorizado");
      expect(mockDeleteOne).not.toHaveBeenCalled();
    });

    it("debe rechazar eliminación sin autenticación", async () => {
      const request = new Request("http://localhost:3000/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: "review123" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });
  });
});
