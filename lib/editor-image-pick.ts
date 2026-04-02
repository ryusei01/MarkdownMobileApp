import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

/**
 * ギャラリーから画像を選び、Markdown の () 内に入れる URI を返す。
 * - Web: data:image/...;base64,...
 * - ネイティブ: アプリ領域へコピーした file://...
 */
export async function pickImageUriForMarkdown(documentFileId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  if (Platform.OS === "web") {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.82,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return null;
    const a = result.assets[0];
    const mime = a.mimeType ?? "image/jpeg";
    return `data:${mime};base64,${a.base64}`;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    allowsMultipleSelection: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const srcUri = result.assets[0].uri;
  const base = FileSystem.documentDirectory;
  if (!base) return null;

  const targetDir = `${base}markdown_embed/${documentFileId}/`;
  await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });

  const roughExt = srcUri.split(/[#?]/)[0]?.split(".").pop()?.toLowerCase();
  const ext =
    roughExt && roughExt.length <= 5 && /^[a-z0-9]+$/i.test(roughExt) ? roughExt : "jpg";
  const dest = `${targetDir}img_${Date.now()}.${ext}`;

  await FileSystem.copyAsync({ from: srcUri, to: dest });

  if (dest.startsWith("file://")) return dest;
  return `file://${dest}`;
}
