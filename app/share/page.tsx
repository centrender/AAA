"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ShareHandler() {
  const router = useRouter();
  const sp = useSearchParams();
  useEffect(() => {
    const text = sp.get("text") || sp.get("url") || "";
    router.replace(text ? `/?text=${encodeURIComponent(text)}` : "/");
  }, [sp, router]);
  return <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#FF5C00", fontFamily: "monospace", fontSize: "13px" }}>LOADING AAA...</div></div>;
}

export default function SharePage() {
  return <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080808" }} />}><ShareHandler /></Suspense>;
}
