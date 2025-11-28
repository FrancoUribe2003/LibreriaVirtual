import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, reviewSchema, voteSchema } from "./validations";

describe("Validation Schemas", () => {
  describe("registerSchema", () => {
    it("debe validar un registro válido", () => {
      const validData = {
        name: "Franco Uribe",
        email: "franco@example.com",
        password: "password123",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("debe rechazar un email inválido", () => {
      const invalidData = {
        name: "Franco Uribe",
        email: "email-invalido",
        password: "password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("debe rechazar un nombre muy corto", () => {
      const invalidData = {
        name: "F",
        email: "franco@example.com",
        password: "password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("debe rechazar una contraseña muy corta", () => {
      const invalidData = {
        name: "Franco Uribe",
        email: "franco@example.com",
        password: "12345",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("debe rechazar datos faltantes", () => {
      const invalidData = {
        name: "Franco Uribe",
        email: "franco@example.com",
        // falta password
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("debe validar un login válido", () => {
      const validData = {
        email: "franco@example.com",
        password: "password123",
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("debe rechazar un email inválido", () => {
      const invalidData = {
        email: "no-es-email",
        password: "password123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("debe rechazar una contraseña vacía", () => {
      const invalidData = {
        email: "franco@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("reviewSchema", () => {
    it("debe validar una reseña válida", () => {
      const validData = {
        bookId: "abc123",
        content: "Este libro es excelente, lo recomiendo mucho.",
        rating: 5,
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("debe rechazar un bookId vacío", () => {
      const invalidData = {
        bookId: "",
        content: "Este libro es excelente.",
        rating: 5,
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("debe rechazar contenido muy corto", () => {
      const invalidData = {
        bookId: "abc123",
        content: "Corto",
        rating: 5,
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("debe rechazar un rating menor a 1", () => {
      const invalidData = {
        bookId: "abc123",
        content: "Este libro es muy malo.",
        rating: 0,
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("debe rechazar un rating mayor a 5", () => {
      const invalidData = {
        bookId: "abc123",
        content: "Este libro es increíble.",
        rating: 6,
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("debe aceptar ratings válidos (1-5)", () => {
      for (let rating = 1; rating <= 5; rating++) {
        const validData = {
          bookId: "abc123",
          content: "Contenido de la reseña suficientemente largo.",
          rating,
        };

        const result = reviewSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("voteSchema", () => {
    it("debe validar un voto válido 'up'", () => {
      const validData = {
        reviewId: "review123",
        vote: "up",
      };

      const result = voteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("debe validar un voto válido 'down'", () => {
      const validData = {
        reviewId: "review123",
        vote: "down",
      };

      const result = voteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("debe rechazar un voto inválido", () => {
      const invalidData = {
        reviewId: "review123",
        vote: "invalid",
      };

      const result = voteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("debe rechazar un reviewId vacío", () => {
      const invalidData = {
        reviewId: "",
        vote: "up",
      };

      const result = voteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
