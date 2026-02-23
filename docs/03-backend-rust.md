# 03 Backend Rust

## 基本方針
Rust 側は「ドメイン」と「Tauri command」を分離する。UI 都合のロジックは command 層に閉じ、ビジネスロジックは domain/service 層に置く。

## 推奨ディレクトリ（`src-tauri/src`）
- `main.rs`: アプリ起動
- `lib.rs`: module 初期化、command 登録
- `commands/`: Tauri commands
- `domain/`: ノート、タグ、リンク等のドメインモデル
- `services/`: Vault操作、検索、ビルドなどのユースケース
- `infra/`: filesystem, process 実行、将来のDB接続
- `errors.rs`: アプリ共通エラー

## 初期 commands（MVP）
- `open_vault(path)`
- `create_note(vault, kind, title)`
- `read_note(path)`
- `save_note(path, content)`
- `build_note(path, engine)`
- `search_notes(vault, query)`

## ビルドエンジン方針
- LaTeX: まず `tectonic` CLI 呼び出しで開始
- Typst: まず `typst` CLI 呼び出しで開始
- 将来: Rust crate 直結で最適化

## エラー設計
- command 返却は `Result<T, AppError>` に統一
- Frontend にはユーザー向け文言へ変換して返す
- ログは Rust 側で詳細化、UI は簡潔に表示
