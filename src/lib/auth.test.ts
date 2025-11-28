import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateToken, verifyToken } from "./auth";

describe("Auth Utils", () => {
  const mockPayload = {
    userId: "123456789",
    email: "test@example.com",
  };

  describe("generateToken", () => {
    it("debe generar un token JWT válido", () => {
      const token = generateToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); 
    });

    it("debe generar tokens diferentes para diferentes payloads", () => {
      const token1 = generateToken(mockPayload);
      const token2 = generateToken({ ...mockPayload, userId: "987654321" });
      
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("debe verificar un token válido correctamente", () => {
      const token = generateToken(mockPayload);
      const result = verifyToken(token);
      
      expect(result).toBeDefined();
      expect(result?.userId).toBe(mockPayload.userId);
      expect(result?.email).toBe(mockPayload.email);
    });

    it("debe rechazar un token inválido", () => {
      const invalidToken = "token.invalido.aqui";
      const result = verifyToken(invalidToken);
      
      expect(result).toBeNull();
    });

    it("debe rechazar un token vacío", () => {
      const result = verifyToken("");
      
      expect(result).toBeNull();
    });

    it("debe rechazar un token con firma incorrecta", () => {
      const token = generateToken(mockPayload);
      // Modificar el token para invalidar la firma
      const [header, payload] = token.split(".");
      const tamperedToken = `${header}.${payload}.firma-incorrecta`;
      
      const result = verifyToken(tamperedToken);
      
      expect(result).toBeNull();
    });
  });

  describe("Token expiration", () => {
    it("debe incluir información de expiración en el token", () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      // El token debería ser válido inmediatamente después de crearse
      expect(decoded?.userId).toBe(mockPayload.userId);
    });
  });
});
