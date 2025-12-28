import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet } from "react-native";
import { useLanguage } from "@/lib/language-provider";
import { useLanguageSettings, type Language } from "@/hooks/use-language-settings";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface LanguageSelectModalProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

export function LanguageSelectModal({ visible, onClose, testID }: LanguageSelectModalProps) {
  const colors = useColors();
  const { t, setLanguage } = useLanguage();
  const { markLanguageSelected, settings } = useLanguageSettings();

  const handleLanguageSelect = async (lang: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setLanguage(lang);
    await markLanguageSelected();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        testID={`${testID}-backdrop`}
      >
        <View
          className="w-80 rounded-2xl p-6 gap-6"
          style={{ backgroundColor: colors.surface }}
          testID={`${testID}-content`}
        >
          <View className="items-center gap-2" testID={`${testID}-header`}>
            <Text className="text-2xl font-bold text-foreground text-center" testID={`${testID}-title`}>
              {t("languageSelect.title")}
            </Text>
            <Text className="text-sm text-muted text-center" testID={`${testID}-subtitle`}>
              {t("languageSelect.subtitle")}
            </Text>
          </View>

          <View className="gap-3" testID={`${testID}-options`}>
            {/* 日本語 */}
            <Pressable
              onPress={() => handleLanguageSelect("ja")}
              testID={`${testID}-option-ja`}
              style={({ pressed }) => [
                styles.languageButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.primary,
                  borderWidth: 2,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text className="text-lg font-semibold text-foreground">
                {t("languageSelect.japanese")}
              </Text>
            </Pressable>

            {/* 英語 */}
            <Pressable
              onPress={() => handleLanguageSelect("en")}
              testID={`${testID}-option-en`}
              style={({ pressed }) => [
                styles.languageButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.primary,
                  borderWidth: 2,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text className="text-lg font-semibold text-foreground">
                {t("languageSelect.english")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  languageButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

