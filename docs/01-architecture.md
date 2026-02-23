# 01 Architecture

## 全体構成
- Frontend: React + TypeScript
- Backend: Tauri (Rust)
- データ: ファイルベース（Vault）+ インデックス用ローカルDB（将来）

## レイヤ分離
- Frontend は UI と状態管理に集中する
- Rust はファイルI/O、検索インデックス、コンパイル実行などのローカル処理を担当する
- Tauri command を境界にして責務を分離する

## 想定コンポーネント
- Vault Manager: Vault の作成・選択・初期化
- Note Manager: ノート作成、保存、メタデータ処理
- Link Graph: `[[WikiLink]]` / バックリンク解析
- Search Indexer: ノート本文とメタ情報の検索インデックス
- Build Engine: LaTeX(Tectonic) / Typst のビルド実行

## データ方針
- ノート実体はファイル
- タグ・タイトル・種別などのメタ情報は先頭ヘッダまたは sidecar で管理（MVPで統一）
- 検索高速化のためのインデックスは後段で導入
