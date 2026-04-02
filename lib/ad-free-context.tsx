import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import {
  useIAP,
  getAvailablePurchases,
  hasActiveSubscriptions,
  fetchProducts as fetchStoreProducts,
  ErrorCode,
  type ProductOrSubscription,
  type ProductSubscription,
  type Purchase,
} from "expo-iap";
import { getLifetimeSku, getSubscriptionSku } from "@/lib/iap-entitlements-config";
import { WEB_AD_FREE_STUB, type AdFreeContextValue } from "@/lib/ad-free-types";

const LIFETIME_STORE_KEY = "markdown_editor_ad_free_lifetime_v1";

const AdFreeContext = createContext<AdFreeContextValue>(WEB_AD_FREE_STUB);

function isPurchasedState(p: Purchase): boolean {
  return p.purchaseState === "purchased" || p.purchaseState === undefined;
}

function isSubscriptionProduct(p: ProductOrSubscription): p is ProductSubscription {
  return p.type === "subs";
}

async function syncLifetimeOwned(lifetimeSku: string): Promise<boolean> {
  if (!lifetimeSku) return false;
  try {
    const purchases = await getAvailablePurchases();
    return purchases.some((p) => p.productId === lifetimeSku && isPurchasedState(p));
  } catch {
    return false;
  }
}

async function syncSubscriptionActive(subscriptionSku: string): Promise<boolean> {
  if (!subscriptionSku) return false;
  try {
    return await hasActiveSubscriptions([subscriptionSku]);
  } catch {
    return false;
  }
}

function AdFreeProviderNative({ children }: { children: ReactNode }) {
  const lifetimeSku = getLifetimeSku();
  const subscriptionSku = getSubscriptionSku();

  const [lifetimeOwned, setLifetimeOwned] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [hydratedDisk, setHydratedDisk] = useState(false);
  const [entitlementsSynced, setEntitlementsSynced] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const applyPurchaseCommon = useCallback(
    async (purchase: Purchase) => {
      if (purchase.productId === lifetimeSku) {
        try {
          await SecureStore.setItemAsync(LIFETIME_STORE_KEY, "1");
        } catch {
          /* 端末のみ */
        }
        setLifetimeOwned(true);
        return;
      }
      if (purchase.productId === subscriptionSku && subscriptionSku) {
        const active = await syncSubscriptionActive(subscriptionSku);
        setSubscriptionActive(active);
      }
    },
    [lifetimeSku, subscriptionSku],
  );

  const { connected, products, subscriptions, fetchProducts, requestPurchase, finishTransaction, restorePurchases } =
    useIAP({
      onPurchaseSuccess: async (purchase: Purchase) => {
        setPurchaseError(null);
        try {
          await finishTransaction({ purchase, isConsumable: false });
        } catch (e) {
          console.warn("[AdFree] finishTransaction", e);
        }
        await applyPurchaseCommon(purchase);
      },
      onPurchaseError: (error) => {
        if (error.code === ErrorCode.UserCancelled) return;
        if (error.code === ErrorCode.AlreadyOwned) {
          void (async () => {
            if (lifetimeSku && (await syncLifetimeOwned(lifetimeSku))) {
              try {
                await SecureStore.setItemAsync(LIFETIME_STORE_KEY, "1");
              } catch {
                /* */
              }
              setLifetimeOwned(true);
            }
            if (subscriptionSku && (await syncSubscriptionActive(subscriptionSku))) {
              setSubscriptionActive(true);
            }
          })();
          return;
        }
        setPurchaseError(error.message ?? String(error.code ?? "purchase_error"));
      },
    });

  useEffect(() => {
    (async () => {
      try {
        const v = await SecureStore.getItemAsync(LIFETIME_STORE_KEY);
        if (v === "1") setLifetimeOwned(true);
      } finally {
        setHydratedDisk(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!connected || !hydratedDisk) return;
    let cancel = false;
    (async () => {
      try {
        if (lifetimeSku) {
          await fetchProducts({ skus: [lifetimeSku], type: "in-app" });
        }
        if (subscriptionSku) {
          await fetchProducts({ skus: [subscriptionSku], type: "subs" });
        }
        const ownsLife = lifetimeSku ? await syncLifetimeOwned(lifetimeSku) : false;
        const subOn = subscriptionSku ? await syncSubscriptionActive(subscriptionSku) : false;
        if (cancel) return;
        if (ownsLife) {
          try {
            await SecureStore.setItemAsync(LIFETIME_STORE_KEY, "1");
          } catch {
            /* */
          }
          setLifetimeOwned(true);
        }
        setSubscriptionActive(subOn);
      } catch (e) {
        console.warn("[AdFree] entitlements sync", e);
      } finally {
        if (!cancel) setEntitlementsSynced(true);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [connected, hydratedDisk, lifetimeSku, subscriptionSku, fetchProducts]);

  const lifetimeProduct = useMemo((): AdFreeContextValue["lifetimeProduct"] => {
    const p = products.find((x) => x.id === lifetimeSku);
    if (!p) return null;
    return { id: p.id, displayPrice: p.displayPrice };
  }, [products, lifetimeSku]);

  const subscriptionProduct = useMemo((): AdFreeContextValue["subscriptionProduct"] => {
    const s = subscriptions.find((x) => x.id === subscriptionSku);
    if (!s) return null;
    return { id: s.id, displayPrice: s.displayPrice };
  }, [subscriptions, subscriptionSku]);

  const purchaseLifetime = useCallback(async () => {
    if (!lifetimeSku) return;
    setPurchaseError(null);
    await requestPurchase({
      request: {
        apple: { sku: lifetimeSku },
        google: { skus: [lifetimeSku] },
      },
      type: "in-app",
    });
  }, [lifetimeSku, requestPurchase]);

  const purchaseSubscription = useCallback(async () => {
    if (!subscriptionSku) return;
    setPurchaseError(null);
    const fetched = await fetchStoreProducts({ skus: [subscriptionSku], type: "subs" });
    const list = (fetched ?? []) as ProductOrSubscription[];
    const sub =
      list.find((p) => isSubscriptionProduct(p) && p.id === subscriptionSku) ??
      subscriptions.find((s) => s.id === subscriptionSku);

    const offerTokens =
      sub?.subscriptionOffers
        ?.filter((o) => o.offerTokenAndroid)
        .map((o) => ({
          sku: subscriptionSku,
          offerToken: o.offerTokenAndroid as string,
        })) ?? [];

    await requestPurchase({
      request: {
        apple: { sku: subscriptionSku },
        google: {
          skus: [subscriptionSku],
          ...(offerTokens.length > 0 ? { subscriptionOffers: offerTokens } : {}),
        },
      },
      type: "subs",
    });
  }, [subscriptionSku, subscriptions, requestPurchase]);

  const restore = useCallback(async () => {
    setPurchaseError(null);
    try {
      await restorePurchases();
      if (lifetimeSku) {
        const owns = await syncLifetimeOwned(lifetimeSku);
        if (owns) {
          try {
            await SecureStore.setItemAsync(LIFETIME_STORE_KEY, "1");
          } catch {
            /* */
          }
          setLifetimeOwned(true);
        }
      }
      if (subscriptionSku) {
        setSubscriptionActive(await syncSubscriptionActive(subscriptionSku));
      }
    } catch (e) {
      setPurchaseError(e instanceof Error ? e.message : "restore_failed");
    }
  }, [restorePurchases, lifetimeSku, subscriptionSku]);

  const adFree = lifetimeOwned || subscriptionActive;
  const clearPurchaseError = useCallback(() => setPurchaseError(null), []);

  const value: AdFreeContextValue = {
    adFree,
    iapReady: connected,
    entitlementsLoading: !hydratedDisk || (connected && !entitlementsSynced),
    lifetimeSku,
    subscriptionSku,
    lifetimeProduct,
    subscriptionProduct,
    purchaseLifetime,
    purchaseSubscription,
    restorePurchases: restore,
    purchaseError,
    clearPurchaseError,
  };

  return <AdFreeContext.Provider value={value}>{children}</AdFreeContext.Provider>;
}

export function AdFreeProvider({ children }: { children: ReactNode }) {
  return <AdFreeProviderNative>{children}</AdFreeProviderNative>;
}

export function useAdFree(): AdFreeContextValue {
  return useContext(AdFreeContext);
}

export type { AdFreeContextValue };
