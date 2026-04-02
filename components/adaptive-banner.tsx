import { useState } from "react";
import { Platform, View } from "react-native";
import Constants from "expo-constants";
import mobileAds, { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { useAdFree } from "@/lib/ad-free-context";

type Extra = {
  adMobBannerIosUnitId?: string;
  adMobBannerAndroidUnitId?: string;
};

function productionUnitId(): string {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  const id =
    Platform.OS === "ios"
      ? extra?.adMobBannerIosUnitId
      : Platform.OS === "android"
        ? extra?.adMobBannerAndroidUnitId
        : undefined;
  return id ?? TestIds.ADAPTIVE_BANNER;
}

/**
 * 画面幅に追従するアンカー型 Adaptive Banner。Web / 広告オフ時は何も出さない。
 */
export function AdaptiveBanner() {
  const { adFree } = useAdFree();
  const [failed, setFailed] = useState(false);

  if (Platform.OS === "web" || adFree || failed) {
    return null;
  }

  const unitId = process.env.NODE_ENV !== "production" ? TestIds.ADAPTIVE_BANNER : productionUnitId();

  return (
    <View style={{ alignItems: "center", width: "100%" }}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

export function initMobileAds(): void {
  if (Platform.OS === "web") return;
  mobileAds()
    .initialize()
    .catch((e) => console.warn("[Ads] init", e));
}
