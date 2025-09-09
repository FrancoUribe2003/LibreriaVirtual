"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/perfil")
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.userId) setUserId(data.userId);
      });
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 bg-black">
      {/* Botón arriba a la izquierda */}
      <button
        className="absolute top-6 left-6 px-4 py-2 border border-white bg-black text-white rounded hover:bg-white hover:text-black transition"
        onClick={() => router.back()}
      >
        ← Volver atrás
      </button>
      <h1 className="text-2xl mb-6 text-white">Perfil de Usuario</h1>
      {user ? (
        <div className="bg-black border border-white p-6 rounded-lg shadow text-white w-full max-w-sm">
          <p className="mb-2"><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      ) : (
        <p className="text-white">Cargando datos...</p>
      )}
    </div>
  );
}