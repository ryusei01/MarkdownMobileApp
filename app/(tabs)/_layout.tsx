import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(tabs)/_layout.tsx:9',message:'TabLayout entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
  // #endregion
  try {
    const colors = useColors();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(tabs)/_layout.tsx:12',message:'useColors success',data:{hasColors:!!colors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    const insets = useSafeAreaInsets();
    const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
    const tabBarHeight = 56 + bottomPadding;

    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            paddingTop: 8,
            paddingBottom: bottomPadding,
            height: tabBarHeight,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
      </Tabs>
    );
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(tabs)/_layout.tsx:47',message:'TabLayout error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}
