"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
    >
      Cerrar Sesión
    </button>
  );
}