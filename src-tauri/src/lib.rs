use tauri::{WebviewUrl, WebviewWindowBuilder};

fn desktop_url() -> String {
    if cfg!(debug_assertions) {
        "http://localhost:3001".to_string()
    } else {
        std::env::var("ATLAS_DESKTOP_URL").unwrap_or_else(|_| "https://app.atlasterminal.com".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let url = desktop_url().parse().map_err(|error| format!("Invalid Atlas URL: {error}"))?;
            WebviewWindowBuilder::new(app, "atlas", WebviewUrl::External(url))
                .title("Atlas Terminal")
                .min_inner_size(1100.0, 720.0)
                .inner_size(1600.0, 980.0)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Atlas Terminal");
}
