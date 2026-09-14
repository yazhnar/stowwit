// stowwit desktop shell.
//
// The window simply loads the shared `ui` static build (see frontendDist in
// tauri.conf.json). All actual logic — git scanning, SQLite indexing, and AI
// summarization — lives in @stowwit/core, which this shell expects to find
// already running locally on :3000 (started separately, or in a future
// iteration bundled as a Tauri sidecar binary). Keeping the desktop shell
// free of business logic means the CLI, VS Code extension, and desktop app
// all stay in sync by construction.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running stowwit desktop shell");
}
