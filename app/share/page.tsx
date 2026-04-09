"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ShareHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = searchParams.get("url") || searchParams.get("text") || "";
    if (url) {
      router.replace(`/?url=${encodeURIComponent(url)}`);
    } else {
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-orange-500 font-mono text-sm animate-pulse">LOADING AAA...</div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-orange-500 font-mono text-sm">LOADING...</div>
      </div>
    }>
      <ShareHandler />
    </Suspense>
  );
}
