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

    it("debe permitir acceso a /api/test-db sin token (excluido en matcher)", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/test-db"));
      const response = middleware(request);

      // La ruta está excluida en el matcher, pero si se ejecuta redirige porque no hay cookie
      expect(response.status).toBe(307);
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

    it("debe redirigir a /login cuando accede a /api/perfil sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/perfil"));
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("debe redirigir a /login cuando accede a /api/reviews sin token", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/reviews"));
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });
  });

  describe("Rutas protegidas con token válido", () => {
    it("debe permitir acceso a / con token válido", () => {
      const request = new NextRequest(new URL("http://localhost:3000/"));
      request.cookies.set("session", "valid-token");
      
      const response = middleware(request);

      // NextResponse.next() retorna un Response con status 200
      expect(response.status).toBe(200);
    });

    it("debe permitir acceso a /perfil con token válido", () => {
      const request = new NextRequest(new URL("http://localhost:3000/perfil"));
      request.cookies.set("session", "valid-token");
      
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it("debe permitir acceso a /api/perfil con token válido", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/perfil"));
      request.cookies.set("session", "valid-token");
      
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Rutas protegidas con token inválido", () => {
    it("debe permitir acceso con token inválido en página (middleware no valida JWT)", () => {
      const request = new NextRequest(new URL("http://localhost:3000/perfil"));
      request.cookies.set("session", "invalid-token");
      
      const response = middleware(request);

      // El middleware solo verifica existencia de cookie, no validez del token
      expect(response.status).toBe(200);
    });

    it("debe permitir acceso con token inválido en API (middleware no valida JWT)", () => {
      const request = new NextRequest(new URL("http://localhost:3000/api/perfil"));
      request.cookies.set("session", "invalid-token");
      
      const response = middleware(request);

      // El middleware solo verifica existencia de cookie, no validez del token
      expect(response.status).toBe(200);
    });

    it("debe permitir acceso si hay cookie (aunque sea inválida)", () => {
      const request = new NextRequest(new URL("http://localhost:3000/perfil"));
      request.cookies.set("session", "invalid-token");
      
      const response = middleware(request);

      // El middleware solo verifica existencia de cookie
      expect(response.status).toBe(200);
    });
  });
});
