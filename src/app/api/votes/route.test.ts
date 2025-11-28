import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import Vote from "@/lib/models/Vote";
import Review from "@/lib/models/Review";
import { getUserFromToken } from "@/lib/auth";

vi.mock("@/lib/mongodb", () => ({
  default: Promise.resolve({
    db: () => ({
      collection: vi.fn(),
    }),
  }),
}));

vi.mock("@/lib/models/Vote", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock("@/lib/models/Review", () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock("@/lib/auth");

describe("Votes API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/votes", () => {
    it("debe agregar un upvote a una reseña", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockReview = {
        _id: "review123",
        userId: "otherUser",
        votes: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);
      vi.mocked(Vote.findOne).mockResolvedValue(null); // No había votado
      vi.mocked(Vote.create).mockResolvedValue({} as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid" },
        body: JSON.stringify({ reviewId: "review123", value: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockReview.votes).toBe(1);
      expect(mockReview.save).toHaveBeenCalled();
    });

    it("debe cambiar upvote a downvote", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockReview = {
        _id: "review123",
        userId: "otherUser",
        votes: 1,
        save: vi.fn(),
      };
      const mockExistingVote = {
        _id: "vote123",
        value: 1,
        save: vi.fn(),
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);
      vi.mocked(Vote.findOne).mockResolvedValue(mockExistingVote as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid" },
        body: JSON.stringify({ reviewId: "review123", value: -1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockReview.votes).toBe(-1); // 1 + (-2) = -1
      expect(mockExistingVote.value).toBe(-1);
    });

    it("debe quitar voto al votar dos veces igual", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockReview = {
        _id: "review123",
        userId: "otherUser",
        votes: 1,
        save: vi.fn(),
      };
      const mockExistingVote = {
        _id: "vote123",
        value: 1,
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);
      vi.mocked(Vote.findOne).mockResolvedValue(mockExistingVote as any);
      vi.mocked(Vote.findByIdAndDelete).mockResolvedValue({} as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid" },
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
      vi.mocked(getUserFromToken).mockResolvedValue(null);

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
      const mockUser = { userId: "user123", email: "user@example.com" };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid" },
        body: JSON.stringify({ reviewId: "review999", value: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar votar tu propia reseña", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockReview = {
        _id: "review123",
        userId: { toString: () => "user123" },
        votes: 0,
      };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Review.findById).mockResolvedValue(mockReview as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid" },
        body: JSON.stringify({ reviewId: "review123", value: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("propia reseña");
    });

    it("debe rechazar value inválido", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);

      const request = new Request("http://localhost:3000/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "token=valid" },
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
      const mockUser = { userId: "user123", email: "user@example.com" };
      const mockVote = { value: 1 };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Vote.findOne).mockResolvedValue(mockVote as any);

      const url = new URL("http://localhost:3000/api/votes?reviewId=review123");
      const request = new Request(url, { headers: { Cookie: "token=valid" } });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.vote).toBe(1);
    });

    it("debe devolver null si no ha votado", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };

      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);
      vi.mocked(Vote.findOne).mockResolvedValue(null);

      const url = new URL("http://localhost:3000/api/votes?reviewId=review123");
      const request = new Request(url, { headers: { Cookie: "token=valid" } });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.vote).toBeNull();
    });

    it("debe rechazar sin autenticación", async () => {
      vi.mocked(getUserFromToken).mockResolvedValue(null);

      const url = new URL("http://localhost:3000/api/votes?reviewId=review123");
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("debe rechazar sin reviewId", async () => {
      const mockUser = { userId: "user123", email: "user@example.com" };
      vi.mocked(getUserFromToken).mockResolvedValue(mockUser as any);

      const url = new URL("http://localhost:3000/api/votes");
      const request = new Request(url, { headers: { Cookie: "token=valid" } });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
    });
  });
});