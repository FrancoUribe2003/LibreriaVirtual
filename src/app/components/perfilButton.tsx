"use client";
import { useRouter } from "next/navigation";

export default function PerfilButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/perfil")}
      className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
    >
      Perfil
    </button>
  );
}