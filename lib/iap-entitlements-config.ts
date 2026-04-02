import Constants from "expo-constants";

export type IapEntitlementsExtra = {
  iapAdFreeLifetimeProductId?: string;
  iapAdFreeSubscriptionProductId?: string;
};

export function getLifetimeSku(): string {
  const extra = Constants.expoConfig?.extra as IapEntitlementsExtra | undefined;
  return extra?.iapAdFreeLifetimeProductId?.trim() ?? "";
}

export function getSubscriptionSku(): string {
  const extra = Constants.expoConfig?.extra as IapEntitlementsExtra | undefined;
  return extra?.iapAdFreeSubscriptionProductId?.trim() ?? "";
}
