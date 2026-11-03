#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Migration, MigrationKind};

fn main() {
    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--disable-gpu");

    // Catch any panic so it never silently shows a blank window
    std::panic::set_hook(Box::new(|info| {
        eprintln!("App panic: {:?}", info);
    }));

    let migrations = vec![Migration {
        version: 1,
        description: "create local cache tables",
        sql: "
            CREATE TABLE IF NOT EXISTS stations (
                id TEXT PRIMARY KEY, name TEXT, category TEXT, level TEXT,
                description TEXT, status TEXT, dirty INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS pricing_tiers (
                id TEXT PRIMARY KEY, station_category TEXT, label TEXT,
                price REAL,
