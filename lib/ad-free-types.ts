/** 設定画面の価格表示用（ネイティブではストアの Product / ProductSubscription を渡す） */
export type AdFreeStoreProductPreview = {
  id: string;
  displayPrice: string;
} | null;

export type AdFreeContextValue = {
  adFree: boolean;
  iapReady: boolean;
  entitlementsLoading: boolean;
  lifetimeSku: string;
  subscriptionSku: string;
  lifetimeProduct: AdFreeStoreProductPreview;
  subscriptionProduct: AdFreeStoreProductPreview;
  purchaseLifetime: () => Promise<void>;
  purchaseSubscription: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  purchaseError: string | null;
  clearPurchaseError: () => void;
};

export const WEB_AD_FREE_STUB: AdFreeContextValue = {
  adFree: false,
  iapReady: false,
  entitlementsLoading: false,
  lifetimeSku: "",
  subscriptionSku: "",
  lifetimeProduct: null,
  subscriptionProduct: null,
  purchaseLifetime: async () => {},
  purchaseSubscription: async () => {},
  restorePurchases: async () => {},
  purchaseError: null,
  clearPurchaseError: () => {},
};
