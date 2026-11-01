#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Migration, MigrationKind};

fn main() {
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
                price REAL, duration_minutes INTEGER
            );
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY, station_id TEXT, user_id TEXT, full_name TEXT,
                contact_method TEXT, contact_value TEXT, booking_date TEXT,
                start_time TEXT, end_time TEXT, mode TEXT, quantity INTEGER,
                total_due REAL, status TEXT, reservation_code TEXT,
                created_at TEXT, dirty INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS sync_meta (
                key TEXT PRIMARY KEY, value TEXT
            );
        ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:lounge-local.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running the app — check the log above");
}
