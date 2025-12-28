import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

/**
 * ファイルシステムユーティリティ（iOS/Android対応）
 */

const APP_DIRECTORY = `${FileSystem.documentDirectory}markdown-files/`;

/**
 * アプリディレクトリを初期化
 */
export async function initializeAppDirectory(): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/file-system-utils.ts:13',message:'initializeAppDirectory entry',data:{appDirectory:APP_DIRECTORY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  try {
    const dirInfo = await FileSystem.getInfoAsync(APP_DIRECTORY);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/file-system-utils.ts:16',message:'getInfoAsync result',data:{exists:dirInfo.exists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(APP_DIRECTORY, { intermediates: true });
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/file-system-utils.ts:18',message:'makeDirectoryAsync success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/file-system-utils.ts:21',message:'initializeAppDirectory success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bfa86673-045b-4235-9277-216d30ed66a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/file-system-utils.ts:23',message:'initializeAppDirectory error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.error("Failed to initialize app directory:", error);
  }
}

/**
 * ファイルを保存
 */
export async function saveFile(fileName: string, content: string): Promise<string> {
  try {
    await initializeAppDirectory();
    const filePath = `${APP_DIRECTORY}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return filePath;
  } catch (error) {
    console.error("Failed to save file:", error);
    throw error;
  }
}

/**
 * ファイルを読み込む
 */
export async function readFile(fileName: string): Promise<string> {
  try {
    const filePath = `${APP_DIRECTORY}${fileName}`;
    const content = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return content;
  } catch (error) {
    console.error("Failed to read file:", error);
    throw error;
  }
}

/**
 * ファイルを削除
 */
export async function deleteFile(fileName: string): Promise<void> {
  try {
    const filePath = `${APP_DIRECTORY}${fileName}`;
    await FileSystem.deleteAsync(filePath);
  } catch (error) {
    console.error("Failed to delete file:", error);
    throw error;
  }
}

/**
 * ファイルを移動（名前変更）
 */
export async function moveFile(oldFileName: string, newFileName: string): Promise<string> {
  try {
    const oldPath = `${APP_DIRECTORY}${oldFileName}`;
    const newPath = `${APP_DIRECTORY}${newFileName}`;
    await FileSystem.moveAsync({ from: oldPath, to: newPath });
    return newPath;
  } catch (error) {
    console.error("Failed to move file:", error);
    throw error;
  }
}

/**
 * ディレクトリ内のファイル一覧を取得
 */
export async function listFiles(): Promise<string[]> {
  try {
    await initializeAppDirectory();
    const files = await FileSystem.readDirectoryAsync(APP_DIRECTORY);
    return files;
  } catch (error) {
    console.error("Failed to list files:", error);
    return [];
  }
}

/**
 * ファイル情報を取得
 */
export async function getFileInfo(fileName: string): Promise<FileSystem.FileInfo> {
  try {
    const filePath = `${APP_DIRECTORY}${fileName}`;
    const info = await FileSystem.getInfoAsync(filePath);
    return info;
  } catch (error) {
    console.error("Failed to get file info:", error);
    throw error;
  }
}
