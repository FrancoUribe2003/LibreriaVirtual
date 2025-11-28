import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const reviewSchema = z.object({
  bookId: z.string().min(1, "ID del libro requerido"),
  content: z.string().min(10, "La reseña debe tener al menos 10 caracteres"),
  rating: z.number().min(1).max(5, "Rating debe estar entre 1 y 5"),
});

export const voteSchema = z.object({
  reviewId: z.string().min(1, "reviewId es requerido"),
  value: z.number().refine((val) => val === 1 || val === -1, {
    message: "value debe ser 1 (upvote) o -1 (downvote)",
  }),
});