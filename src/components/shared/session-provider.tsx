"use client";

import { SessionProvider } from "next-auth/react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath={`${BASE_PATH}/api/auth`}>
      {children}
    </SessionProvider>
  );
}
