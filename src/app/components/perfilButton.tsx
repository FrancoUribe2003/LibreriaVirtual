"use client";
import { useRouter } from "next/navigation";

export default function PerfilButton() {
  const router = useRouter();

  return (
    <button
      title="Ver perfil"
      onClick={() => router.push("/perfil")}
      className="absolute top-4 left-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
    >
      {/* Puedes usar un icono SVG aquí */}
      <span role="img" aria-label="perfil">👤</span>
    </button>
  );
}