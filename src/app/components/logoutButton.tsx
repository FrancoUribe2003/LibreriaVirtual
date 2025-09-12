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
      title="Cerrar sesión"
      onClick={handleLogout}
      className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
    >
      <span role="img" aria-label="logout">🔒</span>
    </button>
  );
}