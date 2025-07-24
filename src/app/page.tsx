"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        router.replace("/master-categories");
      } else {
        router.replace("/login");
      }
    }
  }, [router]);
  return null;
} 