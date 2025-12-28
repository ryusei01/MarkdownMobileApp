#!/usr/bin/env node
import { createCanvas, loadImage, registerFont } from 'canvas';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 設定
const width = 1024;
const height = 500;
const outputPath = join(projectRoot, 'assets/images/feature-graphic.png');
const iconPath = join(projectRoot, 'assets/images/icon.png');

// アプリ情報
const appName = 'Markdown Editor';
const subtitle = '美しく、シンプルなMarkdownエディタ';

async function generateFeatureGraphic() {
  console.log('🎨 フィーチャーグラフィックを生成中...');
  
  // Canvas作成
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 背景グラデーション（アプリのテーマカラーに合わせる）
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#E6F4FE'); // ライトブルー
  gradient.addColorStop(1, '#B3E5FC'); // 少し濃いブルー
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // アイコンの配置設定（アイコンがなくてもテキスト配置に使用）
  const iconSize = 200;
  const iconX = 120; // 左側に適切な余白を確保
  const iconY = (height - iconSize) / 2;
  
  // アイコン画像を読み込んで配置
  try {
    const iconImg = await loadImage(iconPath);
    
    // アイコンの影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
    
    // 影の設定をリセット
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } catch (error) {
    console.warn('⚠️  アイコン画像の読み込みに失敗しました。テキストのみで生成します。', error.message);
  }
  
  // アプリ名
  ctx.fillStyle = '#1976D2';
  ctx.font = 'bold 72px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const textX = iconX + iconSize + 60; // アイコンの右側に適切な間隔を確保
  const textY = height / 2 - 40;
  ctx.fillText(appName, textX, textY);
  
  // サブタイトル
  ctx.fillStyle = '#424242';
  ctx.font = '32px "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(subtitle, textX, textY + 80);
  
  // 装飾的な要素（Markdownの記号をモチーフに）
  ctx.strokeStyle = '#64B5F6';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  // 左側に装飾的な線
  ctx.beginPath();
  ctx.moveTo(50, 100);
  ctx.lineTo(50, 400);
  ctx.stroke();
  
  // 右側に装飾的な線
  ctx.beginPath();
  ctx.moveTo(width - 50, 100);
  ctx.lineTo(width - 50, 400);
  ctx.stroke();
  
  ctx.setLineDash([]);
  
  // PNGとして保存
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(outputPath, buffer);
  
  console.log(`✅ フィーチャーグラフィックを生成しました: ${outputPath}`);
  console.log(`   サイズ: ${width}x${height}px`);
}

generateFeatureGraphic().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
