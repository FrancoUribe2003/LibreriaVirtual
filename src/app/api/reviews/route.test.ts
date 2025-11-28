import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PATCH, DELETE } from "./route";
import Review from "@/lib/models/Review";
import { getUserFromToken } from "@/lib/auth";

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: vi.fn(),
    }),
  }),
}));

vi.mock("@/lib/models/Review", () => ({
  default: {
    find: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock("@/lib/auth");

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
          userId: { _id: "user1", name: "User 1" },
          content: "Excelente libro",
          rating: 5,
          votes: 10,
        },
        {
          _id: "2",
          bookId: "book123",
          userId: { _id: "user2", name: "User 2" },
          content: "Muy bueno",
          rating: 4,
          votes: 5,
        },
      ];

      vi.mocked(Review.find).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockReviews),
      } as any);

      const url = new URL("http://localhost:3000/api/reviews?bookId=book123");
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.reviews).toHaveLength(2);
      expect(Review.find).toHaveBeenCalledWith({ bookId: "book123" });
    });

    it("debe rechazar solicitud sin bookId", async () => {
      const url = new URL("http://localhost:3000/api/reviews");
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("bookId es requerido");
    });

    it("debe devolver array vacío si no hay reseñas", async () => {
      vi.mocked(Review.find).mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      } as any);

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
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockReview = {
        _id: "review123",
        bookId: "book123",
        userId: "user123",
        content: "Esta es una reseña excelente de este libro.",
        rating: 5,
        votes: 0,
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.create).mockResolvedValue(mockReview as any);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({
          bookId: "book123",
          content: "Esta es una reseña excelente de este libro.",
          rating: 5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ok).toBe(true);
      expect(data.review).toBeDefined();
      expect(Review.create).toHaveBeenCalledWith({
        bookId: "book123",
        userId: "user123",
        content: "Esta es una reseña excelente de este libro.",
        rating: 5,
      });
    });

    it("debe rechazar reseña sin autenticación", async () => {
      vi.mocked(getUserFromToken).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: "book123",
          content: "Contenido de la reseña",
          rating: 5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("autenticación");
    });

    it("debe rechazar datos inválidos (contenido muy corto)", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({
          bookId: "book123",
          content: "Corto", // Contenido muy corto
          rating: 5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar rating fuera de rango", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({
          bookId: "book123",
          content: "Esta es una reseña con suficiente contenido.",
          rating: 6, // Rating inválido
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar datos faltantes (sin bookId)", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({
          content: "Contenido suficiente para la reseña.",
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
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockReview = {
        _id: "review123",
        bookId: "book123",
        userId: "user123",
        content: "Contenido original",
        rating: 3,
        toString: () => "user123",
      };

      const mockUpdatedReview = {
        ...mockReview,
        content: "Contenido actualizado con más detalles sobre el libro.",
        rating: 5,
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);
      vi.mocked(Review.findByIdAndUpdate).mockResolvedValue(mockUpdatedReview as any);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({
          reviewId: "review123",
          content: "Contenido actualizado con más detalles sobre el libro.",
          rating: 5,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.review).toBeDefined();
    });

    it("debe rechazar actualización de reseña ajena", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockReview = {
        _id: "review123",
        userId: "otherUser", // Reseña de otro usuario
        content: "Contenido original",
        rating: 3,
        toString: () => "otherUser",
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({
          reviewId: "review123",
          content: "Intento de actualizar reseña ajena.",
          rating: 5,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("autorizado");
    });

    it("debe rechazar actualización sin autenticación", async () => {
      vi.mocked(getUserFromToken).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: "review123",
          content: "Contenido actualizado",
          rating: 5,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar actualización de reseña inexistente", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: "token=valid-token" },
        body: JSON.stringify({
          reviewId: "review999",
          content: "Intento de actualizar reseña inexistente.",
          rating: 5,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("Reseña no encontrada");
    });
  });

  describe("DELETE /api/reviews", () => {
    it("debe eliminar una reseña propia", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockReview = {
        _id: "review123",
        userId: "user123",
        content: "Mi reseña",
        rating: 5,
        toString: () => "user123",
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);
      vi.mocked(Review.findByIdAndDelete).mockResolvedValue(mockReview as any);

      const url = new URL("http://localhost:3000/api/reviews?reviewId=review123");
      const request = new Request(url, { method: "DELETE", headers: { Cookie: "token=valid-token" } });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(Review.findByIdAndDelete).toHaveBeenCalledWith("review123");
    });

    it("debe rechazar eliminación de reseña ajena", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockReview = {
        _id: "review123",
        userId: "otherUser", // Reseña de otro usuario
        content: "Reseña ajena",
        rating: 4,
        toString: () => "otherUser",
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);

      const url = new URL("http://localhost:3000/api/reviews?reviewId=review123");
      const request = new Request(url, { method: "DELETE", headers: { Cookie: "token=valid-token" } });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("autorizado");
      expect(Review.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("debe rechazar eliminación sin autenticación", async () => {
      vi.mocked(getUserFromToken).mockResolvedValue(null);

      const url = new URL("http://localhost:3000/api/reviews?reviewId=review123");
      const request = new Request(url, { method: "DELETE" });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar solicitud sin reviewId", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);

      const url = new URL("http://localhost:3000/api/reviews");
      const request = new Request(url, { method: "DELETE", headers: { Cookie: "token=valid-token" } });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("reviewId");
    });

    it("debe rechazar eliminación de reseña inexistente", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(null);

      const url = new URL("http://localhost:3000/api/reviews?reviewId=review999");
      const request = new Request(url, { method: "DELETE", headers: { Cookie: "token=valid-token" } });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("Reseña no encontrada");
    });
  });
});
