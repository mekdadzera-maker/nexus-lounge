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
                id TEXT PRIMARY KEY, name TEXT, category TEXT, status TEXT
            );
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY, station_id TEXT, full_name TEXT,
                booking_date TEXT, start_time TEXT, end_time TEXT,
                status TEXT, total_due REAL, synced INTEGER DEFAULT 0
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
