import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import jwt from "jsonwebtoken";

// Definir mocks antes de usarlos
vi.mock("mongoose", () => ({
  default: {
    connection: { readyState: 1 },
    connect: vi.fn(),
  },
}));

vi.mock("jsonwebtoken");

// Mock factories con funciones
vi.mock("@/lib/models/Vote", () => {
  const mockFindOne = vi.fn();
  const mockCreate = vi.fn();
  const mockFindByIdAndDelete = vi.fn();
  
  return {
    default: {
      findOne: mockFindOne,
      create: mockCreate,
      findByIdAndDelete: mockFindByIdAndDelete,
    },
    __mocks: { mockFindOne, mockCreate, mockFindByIdAndDelete },
  };
});

vi.mock("@/lib/models/Review", () => {
  const mockFindById = vi.fn();
  
  return {
    default: {
      findById: mockFindById,
    },
    __mocks: { mockFindById },
  };
});

// Importar después de los mocks
import Vote from "@/lib/models/Vote";
import Review from "@/lib/models/Review";

describe("Votes API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/votes", () => {
    it("debe agregar un upvote a una reseña", async () => {
      const mockSave = vi.fn();
      const mockReview = {
        _id: "review123",
        userId: { toString: () => "otherUser" },
        votes: 0,
        save: mockSave,
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);
      vi.mocked(Vote.findOne).mockResolvedValue(null); // No había votado
      vi.mocked(Vote.create).mockResolvedValue({ vote: 1 } as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid" },
        body: JSON.stringify({ reviewId: "review123", value: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockReview.votes).toBe(1);
      expect(mockSave).toHaveBeenCalled();
    });

    it("debe cambiar upvote a downvote", async () => {
      const mockSave = vi.fn();
      const mockReview = {
        _id: "review123",
        userId: { toString: () => "otherUser" },
        votes: 1,
        save: mockSave,
      };
      const mockExistingVote = {
        _id: "vote123",
        vote: 1,
        save: mockSave,
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);
      vi.mocked(Vote.findOne).mockResolvedValue(mockExistingVote as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid" },
        body: JSON.stringify({ reviewId: "review123", value: -1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockReview.votes).toBe(-1); // 1 + (-2) = -1
      expect(mockExistingVote.vote).toBe(-1);
    });

    it("debe quitar voto al votar dos veces igual", async () => {
      const mockSave = vi.fn();
      const mockReview = {
        _id: "review123",
        userId: { toString: () => "otherUser" },
        votes: 1,
        save: mockSave,
      };
      const mockExistingVote = {
        _id: "vote123",
        vote: 1,
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);
      vi.mocked(Vote.findOne).mockResolvedValue(mockExistingVote as any);
      vi.mocked(Vote.findByIdAndDelete).mockResolvedValue(mockExistingVote as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid" },
        body: JSON.stringify({ reviewId: "review123", value: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockReview.votes).toBe(0); // 1 + (-1) = 0
      expect(Vote.findByIdAndDelete).toHaveBeenCalledWith("vote123");
    });

    it("debe rechazar votar sin autenticación", async () => {
      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: "review123", value: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar votar reseña inexistente", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      vi.mocked(Review.findById).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid" },
        body: JSON.stringify({ reviewId: "review999", value: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar votar tu propia reseña", async () => {
      const mockReview = {
        _id: "review123",
        userId: { toString: () => "user123" },
        votes: 0,
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid" },
        body: JSON.stringify({ reviewId: "review123", value: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("propia reseña");
    });

    it("debe rechazar value inválido", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "session=valid" },
        body: JSON.stringify({ reviewId: "review123", value: 5 }), // Inválido
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });
  });

  describe("GET /api/votes", () => {
    it("debe obtener el voto del usuario para una reseña", async () => {
      const mockVote = { vote: 1 };

      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      vi.mocked(Vote.findOne).mockResolvedValue(mockVote as any);

      const url = new URL("http://localhost:3000/api/votes?reviewId=review123");
      const request = new Request(url, { headers: { Cookie: "session=valid" } });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.vote).toBe(1);
    });

    it("debe devolver null si no ha votado", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);
      vi.mocked(Vote.findOne).mockResolvedValue(null);

      const url = new URL("http://localhost:3000/api/votes?reviewId=review123");
      const request = new Request(url, { headers: { Cookie: "session=valid" } });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.vote).toBeNull();
    });

    it("debe rechazar sin autenticación", async () => {
      const url = new URL("http://localhost:3000/api/votes?reviewId=review123");
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar sin reviewId", async () => {
      vi.mocked(jwt.verify).mockReturnValue({ userId: "user123", email: "user@example.com" } as any);

      const url = new URL("http://localhost:3000/api/votes");
      const request = new Request(url, { headers: { Cookie: "session=valid" } });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });
  });
});
