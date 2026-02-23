# 02 Frontend Features

## 基本方針
React 側は `features` を最上位にした機能分割を採用する。

## ディレクトリ規約
- `src/app`: エントリ、ルーティング、グローバル初期化
- `src/features/<feature-name>`: 機能単位の UI / state / API 呼び出し
- `src/shared`: 複数 features から再利用する UI / utils / types

## 推奨例
- `src/features/vault`
- `src/features/note-editor`
- `src/features/search`
- `src/features/tagging`
- `src/features/graph`
- `src/features/build`

## feature 内の推奨構成
- `components/`: その feature 専用UI
- `state/`: featureローカル状態
- `api/`: tauri invoke ラッパ
- `types.ts`: feature専用型
- `index.ts`: 公開API（外部公開点）

## 依存ルール
- feature -> shared は許可
- feature -> 他 feature の内部ファイル参照は禁止（`index.ts` 経由のみ）
- app は feature の公開APIのみ利用

## 命名ルール
- feature 名は kebab-case
- React component は PascalCase
- hooks は `useXxx` 形式
