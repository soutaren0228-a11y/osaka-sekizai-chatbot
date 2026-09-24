"use client";

import { createContext, useContext } from "react";
import type { MemberRole } from "@/lib/data/members";

interface Session {
  email: string;
  role: MemberRole;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession must be used within SessionProvider (管理画面レイアウトの内側)");
  }
  return session;
}
