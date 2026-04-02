import { createContext, useContext, type ReactNode } from "react";
import { WEB_AD_FREE_STUB, type AdFreeContextValue } from "@/lib/ad-free-types";

const AdFreeContext = createContext<AdFreeContextValue>(WEB_AD_FREE_STUB);

export function AdFreeProvider({ children }: { children: ReactNode }) {
  return <AdFreeContext.Provider value={WEB_AD_FREE_STUB}>{children}</AdFreeContext.Provider>;
}

export function useAdFree(): AdFreeContextValue {
  return useContext(AdFreeContext);
}

export type { AdFreeContextValue };
