import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "./middleware";
import * as auth from "./lib/auth";

vi.mock("./lib/auth", () => ({
  verifyToken: vi.fn(),
}));

describe("Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rutas públicas", () => {
    it("debe permitir acceso a /login sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/login"));
      const response = middleware(request);

      expect(response.status).not.toBe(307); // No debe redirigir
    });

    it("debe permitir acceso a /register sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/register"));
      const response = middleware(request);

      expect(response.status).not.toBe(307);
    });

    it("debe permitir acceso a /api/login sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/login"));
      const response = middleware(request);

      expect(response.status).not.toBe(307);
    });

    it("debe permitir acceso a /api/register sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/register"));
      const response = middleware(request);

      expect(response.status).not.toBe(307);
    });

    it("debe permitir acceso a /api/test-db sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/test-db"));
      const response = middleware(request);

      expect(response.status).not.toBe(307);
    });
  });

  describe("Rutas protegidas sin token", () => {
    it("debe redirigir a /login cuando accede a / sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/"));
      const response = middleware(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/login");
    });

    it("debe redirigir a /login cuando accede a /perfil sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/perfil"));
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("debe devolver 401 JSON cuando accede a /api/perfil sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/perfil"));
      const response = middleware(request);

      expect(response.status).toBe(401);
    });

    it("debe devolver 401 JSON cuando accede a /api/reviews sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/reviews"));
      const response = middleware(request);

      expect(response.status).toBe(401);
    });
  });

  describe("Rutas protegidas con token válido", () => {
    beforeEach(() => {
      // Mock de verifyToken para devolver un payload válido
      vi.mocked(auth.verifyToken).mockReturnValue({
        userId: "123",
        email: "test@example.com",
      });
    });

    it("debe permitir acceso a / con token válido", () => {
      const request = new NextRequest(new URL("http://localhost:3000/"));
      request.cookies.set("token", "valid-token");
      
      const response = middleware(request);

      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(401);
    });

    it("debe permitir acceso a /perfil con token válido", () => {
      const request = new NextRequest(new URL("http://localhost:3000/perfil"));
      request.cookies.set("token", "valid-token");
      
      const response = middleware(request);

      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(401);
    });

    it("debe permitir acceso a /api/perfil con token válido", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/perfil"));
      request.cookies.set("token", "valid-token");
      
      const response = middleware(request);

      expect(response.status).not.toBe(401);
    });
  });

  describe("Rutas protegidas con token inválido", () => {
    beforeEach(() => {
      // Mock de verifyToken para devolver null (token inválido)
      vi.mocked(auth.verifyToken).mockReturnValue(null);
    });

    it("debe redirigir a /login con token inválido en página", () => {
      const request = new NextRequest(new URL("http://localhost:3000/perfil"));
      request.cookies.set("token", "invalid-token");
      
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("debe devolver 401 con token inválido en API", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/perfil"));
      request.cookies.set("token", "invalid-token");
      
      const response = middleware(request);

      expect(response.status).toBe(401);
    });

    it("debe eliminar la cookie de token inválido", () => {
      const request = new NextRequest(new URL("http://localhost:3000/perfil"));
      request.cookies.set("token", "invalid-token");
      
      const response = middleware(request);

      // Verificar que se intenta eliminar la cookie
      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).toContain("token=");
    });
  });
});
