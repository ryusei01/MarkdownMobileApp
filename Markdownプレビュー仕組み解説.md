# Markdownプレビューの仕組み解説

## 概要

このアプリケーションでは、Markdownテキストをリアルタイムでプレビュー表示する機能を実装しています。React Native環境で動作するカスタムMarkdownパーサーを使用して、Markdown構文をReact Nativeのコンポーネントに変換して表示します。

## アーキテクチャ

### コンポーネント構成

```
app/editor.tsx (エディタ画面)
  └─ components/markdown-preview.tsx (プレビューコンポーネント)
```

### データフロー

1. **エディタ入力**: ユーザーが`TextInput`でMarkdownテキストを入力
2. **状態管理**: `content`ステートにテキストが保存される
3. **タブ切り替え**: ユーザーが「プレビュー」タブを選択
4. **パース処理**: `MarkdownPreview`コンポーネントが`content`を受け取り、パース処理を実行
5. **レンダリング**: パース結果をReact Nativeコンポーネントとして表示

## 実装の詳細

### 1. MarkdownPreviewコンポーネント

**ファイル**: `components/markdown-preview.tsx`

#### プロパティ

```typescript
interface MarkdownPreviewProps {
  content: string; // 表示するMarkdownコンテンツ
  className?: string; // 追加のCSSクラス名
}
```

#### 主要な機能

- Markdownテキストを受け取り、React Nativeコンポーネントに変換
- `ScrollView`でスクロール可能なプレビューを提供
- テーマ対応（`useColors`フックを使用）

### 2. パーサーの実装

`parseMarkdown`関数がMarkdownテキストを1行ずつ解析し、対応するReact要素を生成します。

#### パース処理の流れ

1. **行分割**: `text.split("\n")`でテキストを行単位に分割
2. **順次解析**: 各行を順番に解析し、構文パターンを検出
3. **要素生成**: 検出した構文に応じてReact要素を生成
4. **配列返却**: 生成した要素の配列を返却

#### サポートしている構文

このパーサーは以下のMarkdown構文をサポートしています：

- 見出し（`# ## ### ####`）
- 太字（`**text**` または `__text__`）
- イタリック（`*text*` または `_text_`）
- 打ち消し線（`~~text~~`）
- リスト（`-` または `*`）
- 番号付きリスト（`1. 2.` など）
- チェックボックスリスト（`- [ ]` または `- [x]`）
- コードブロック（` ```...``` `）
- インラインコード（`` `code` ``）
- リンク（`[text](url)`）
- 画像（`![alt](url)`）
- 引用（`>`）
- 水平線（`---`）
- テーブル（`|` で区切られた行）

##### 見出し（# ## ### ####）

```markdown
# 見出し1

## 見出し2

### 見出し3

#### 見出し4
```

**実装**:

- 行の先頭が`#`で始まるかチェック
- `#`の数に応じてフォントサイズとマージンを調整
- H1: フォントサイズ × 1.5、マージン上4、下3
- H2: フォントサイズ × 1.25、マージン上4、下2
- H3: フォントサイズ × 1.125、マージン上3、下2
- H4: フォントサイズ × 1.0625、マージン上2、下1
- `Text`コンポーネントで表示

**コード例**:

```40:66:components/markdown-preview.tsx
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 見出し（# ## ### #### など）
      if (line.startsWith("#### ")) {
        const headingText = line.substring(5);
        elements.push(
          <Text key={`h4-${i}`} className="font-bold text-foreground mt-2 mb-1" style={{ fontSize: fontSize * 1.0625 }}>
            {parseInlineElements(headingText, `h4-${i}`)}
          </Text>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <Text key={`h3-${i}`} className="text-lg font-bold text-foreground mt-3 mb-2">
            {line.substring(4)}
          </Text>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <Text key={`h2-${i}`} className="text-xl font-bold text-foreground mt-4 mb-2">
            {line.substring(3)}
          </Text>
        );
      } else if (line.startsWith("# ")) {
        elements.push(
          <Text key={`h1-${i}`} className="text-2xl font-bold text-foreground mt-4 mb-3">
            {line.substring(2)}
          </Text>
        );
      }
```

##### 太字（**text** または **text**）

```markdown
これは**太字**のテキストです
これは**太字**のテキストです
```

**実装**:

- 正規表現で`**`または`__`で囲まれた部分を検出
- 該当部分を`font-bold`スタイルの`Text`コンポーネントで表示

**コード例**:

```68:85:components/markdown-preview.tsx
      // 太字（**text** または __text__）
      else if (line.includes("**") || line.includes("__")) {
        const parts = line.split(/(\*\*.*?\*\*|__.*?__)/);
        elements.push(
          <Text key={`bold-${i}`} className="text-base text-foreground leading-relaxed mb-2">
            {parts.map((part, idx) => {
              if (part.startsWith("**") || part.startsWith("__")) {
                const text = part.substring(2, part.length - 2);
                return (
                  <Text key={idx} className="font-bold">
                    {text}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      }
```

##### イタリック（_text_ または _text_）

```markdown
これは*イタリック*のテキストです
これは*イタリック*のテキストです
```

**実装**:

- 正規表現で`*`または`_`で囲まれた部分を検出（太字と区別するため、2文字連続でない場合）
- 該当部分を`italic`スタイルの`Text`コンポーネントで表示
- `parseInlineElements`関数内で処理され、太字やコードと重複しないように優先順位を考慮

##### 打ち消し線（~~text~~）

```markdown
これは~~打ち消し線~~のテキストです
```

**実装**:

- 正規表現で`~~`で囲まれた部分を検出
- 該当部分に`textDecorationLine: "line-through"`スタイルを適用
- `parseInlineElements`関数内で処理され、太字やコードと重複しないように優先順位を考慮
- 優先順位: 画像 > リンク > コード > 太字 > 打ち消し線 > イタリック

**コード例**:

```typescript
// 打ち消し線を処理（~~text~~）
const strikethroughRegex = /~~(.+?)~~/g;
let strikethroughMatch;
while ((strikethroughMatch = strikethroughRegex.exec(text)) !== null) {
  // 太字やコードの一部でないことを確認
  const isPartOfOther = allMatches.some(
    (m) => strikethroughMatch.index >= m.index && strikethroughMatch.index < m.index + m.length,
  );
  if (!isPartOfOther) {
    allMatches.push({
      type: "strikethrough",
      index: strikethroughMatch.index,
      length: strikethroughMatch[0].length,
      data: { text: strikethroughMatch[1] },
    });
  }
}

// レンダリング時
else if (match.type === "strikethrough") {
  const { text: strikethroughText } = match.data;
  elements.push(
    <Text key={`${keyPrefix}-strikethrough-${elementIndex}`} style={{ textDecorationLine: "line-through" }}>
      {strikethroughText}
    </Text>
  );
}
```

##### リスト（- または \*）

```markdown
- リスト項目1
- リスト項目2

* リスト項目3
```

**実装**:

- 行の先頭が`- `または`* `で始まるかチェック
- 箇条書き記号（`•`）とテキストを`View`と`Text`コンポーネントで表示

**コード例**:

```106:114:components/markdown-preview.tsx
      // リスト（- または *）
      else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const text = line.trim().substring(2);
        elements.push(
          <View key={`list-${i}`} className="flex-row items-start mb-1 pl-4">
            <Text className="text-foreground mr-2">•</Text>
            <Text className="text-base text-foreground flex-1 leading-relaxed">{text}</Text>
          </View>
        );
      }
```

##### コードブロック（`...`）

```markdown

```

コードブロック
複数行のコード

```

```

**実装**:

- 行が` ``` `で始まるかチェック
- 次の` ``` `までをコードブロックとして扱う
- `View`コンポーネントで背景色とボーダーを設定し、等幅フォントで表示

**コード例**:

````116:133:components/markdown-preview.tsx
      // コードブロック（```...```）
      else if (line.startsWith("```")) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <View
            key={`code-${i}`}
            className="bg-surface rounded-lg p-3 mb-3 border border-border"
          >
            <Text className="text-sm text-muted font-mono leading-relaxed">
              {codeLines.join("\n")}
            </Text>
          </View>
        );
      }
````

##### インラインコード（`code`）

```markdown
これは`インラインコード`の例です
```

**実装**:

- 行内にバッククォート（`` ` ``）が含まれているかチェック
- 正規表現でバッククォートで囲まれた部分を検出
- 該当部分を背景色付きの等幅フォントで表示

**コード例**:

```135:155:components/markdown-preview.tsx
      // インラインコード（`code`）
      else if (line.includes("`")) {
        const parts = line.split(/(`[^`]+`)/);
        elements.push(
          <Text key={`inline-code-${i}`} className="text-base text-foreground leading-relaxed mb-2">
            {parts.map((part, idx) => {
              if (part.startsWith("`") && part.endsWith("`")) {
                const code = part.substring(1, part.length - 1);
                return (
                  <Text
                    key={idx}
                    className="bg-surface px-1 py-0.5 rounded font-mono text-sm text-primary"
                  >
                    {code}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      }
```

##### 空行

空行は適切な間隔を保つために`View`コンポーネントで高さを確保します。

**コード例**:

```157:159:components/markdown-preview.tsx
      // 空行
      else if (line.trim() === "") {
        elements.push(<View key={`space-${i}`} className="h-2" />);
      }
```

##### 通常のテキスト

上記の構文に該当しない行は通常のテキストとして表示されます。

**コード例**:

```161:167:components/markdown-preview.tsx
      // 通常のテキスト
      else if (line.trim()) {
        elements.push(
          <Text key={`text-${i}`} className="text-base text-foreground leading-relaxed mb-2">
            {line}
          </Text>
        );
      }
```

### 3. エディタ画面での使用

**ファイル**: `app/editor.tsx`

エディタ画面では、タブ切り替え機能により「エディタ」と「プレビュー」を切り替えることができます。

#### タブ切り替えの実装

```typescript
const [activeTab, setActiveTab] = useState<TabType>("editor");
```

#### プレビューの表示

```326:326:app/editor.tsx
            <MarkdownPreview content={content} className="flex-1" testID="editor-preview" />
```

プレビュータブが選択されている場合、`MarkdownPreview`コンポーネントに現在の`content`を渡して表示します。

## スタイリング

### テーマ対応

`useColors`フックを使用して、アプリのテーマに応じた色を取得しています。

```typescript
const colors = useColors();
```

### NativeWind（Tailwind CSS）

NativeWindを使用して、Tailwind CSSのクラス名でスタイリングを行っています。

- `text-foreground`: 前景色（テキスト色）
- `text-muted`: ミュートされた色
- `bg-surface`: サーフェス背景色
- `border-border`: ボーダー色
- `text-primary`: プライマリ色

## パフォーマンス

### 最適化の考慮事項

1. **再レンダリング**: `content`が変更されるたびにパース処理が実行される
2. **キーの使用**: 各要素に一意の`key`プロパティを設定してReactの最適化を活用
3. **ScrollView**: 長いコンテンツでもスムーズにスクロールできるよう`ScrollView`を使用

### 今後の改善案

- メモ化（`useMemo`）を使用してパース結果をキャッシュ
- 仮想化リスト（`FlatList`）を使用して長いコンテンツのパフォーマンスを向上
- Web Workerを使用してパース処理を非同期化（Web版の場合）

## 実装済みの追加構文

以下の構文が実装され、現在サポートされています：

### 番号付きリスト（`1. `）

```markdown
1. 最初の項目
2. 2番目の項目
3. 3番目の項目
```

**実装**:

- 行の先頭が数字とピリオドで始まるかチェック
- 番号とテキストを`View`と`Text`コンポーネントで表示

### リンク（`[text](url)`）

```markdown
[リンクテキスト](https://example.com)
```

**実装**:

- 正規表現で`[text](url)`パターンを検出
- `Text`コンポーネントでリンクを表示し、`Linking.openURL`でURLを開く

### 画像（`![alt](url)`）

```markdown
![代替テキスト](https://example.com/image.png)
```

**実装**:

- 正規表現で`![alt](url)`パターンを検出
- `Image`コンポーネントで画像を表示
- 代替テキストがある場合は画像の下に表示

### 引用（`>`）

```markdown
> これは引用テキストです
> 複数行の引用も可能です
```

**実装**:

- 行が`> `で始まるかチェック
- 連続する引用行をまとめて処理
- 左側にボーダーを表示して引用を視覚的に区別

### 水平線（`---`）

```markdown
---
```

**実装**:

- 行が`-`、`*`、または`_`の3文字以上で構成されているかチェック
- `View`コンポーネントで水平線を表示

### テーブル

```markdown
| ヘッダー1 | ヘッダー2 | ヘッダー3 |
| --------- | --------- | --------- |
| セル1     | セル2     | セル3     |
| セル4     | セル5     | セル6     |
```

**実装**:

- `|`で区切られた行を検出
- 最初の行をヘッダーとして処理
- 2行目（区切り行）をスキップ
- 以降の行をデータ行として処理
- `View`と`Text`コンポーネントでテーブル構造を構築

### チェックボックスリスト（`- [ ]` または `- [x]`）

```markdown
- [ ] 未完了のタスク
- [x] 完了したタスク
```

**実装**:

- 行が`- [ ]`または`- [x]`で始まるかチェック
- チェック状態に応じて`☐`または`☑`を表示

## インライン要素の処理

インライン要素（リンク、画像、太字、イタリック、インラインコード）は、`parseInlineElements`関数で処理されます。この関数は、テキスト内のすべてのインライン要素を検出し、適切なReact要素に変換します。

処理の優先順位：

1. 画像（`![alt](url)`）
2. リンク（`[text](url)`）
3. インラインコード（`` `code` ``）
4. 太字（`**text**` または `__text__`）
5. 打ち消し線（`~~text~~`）
6. イタリック（`*text*` または `_text_`）

この優先順位により、複数のインライン要素が混在する場合でも正しく処理されます。

## 制限事項

現在の実装では、以下のMarkdown構文はサポートしていません：

- ネストされたリスト（リスト内のリスト）
- コードブロックの言語指定（シンタックスハイライト）
- 参照形式のリンク（`[text][ref]`）
- 参照形式の画像（`![alt][ref]`）
- 脚注
- 定義リスト
- タスクリストのインタラクティブなチェック機能（表示のみ）

これらをサポートする場合は、パーサーのさらなる拡張が必要です。

## まとめ

このアプリケーションのMarkdownプレビュー機能は、カスタムパーサーを使用してMarkdownテキストをReact Nativeコンポーネントに変換しています。シンプルな実装ながら、基本的なMarkdown構文をサポートし、リアルタイムでプレビューを表示することができます。

### 主な特徴

- ✅ カスタムパーサーによる軽量な実装
- ✅ React Nativeネイティブコンポーネントを使用
- ✅ テーマ対応
- ✅ リアルタイムプレビュー
- ✅ 豊富なMarkdown構文をサポート（見出し、リスト、リンク、画像、テーブルなど）
- ✅ インライン要素の適切な処理（リンク、画像、太字、打ち消し線、イタリック、コード）

### 技術スタック

- React Native
- TypeScript
- NativeWind (Tailwind CSS)
- カスタムMarkdownパーサー
