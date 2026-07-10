package config

// AllowedOrigins builds the CORS allow-list from the configured frontend
// origin, any explicit CORS_ALLOWED_ORIGINS entries, and the known production
// and local development origins. Duplicates and empty values are removed.
func AllowedOrigins(env Env) []string {
	candidates := []string{
		env.FrontendOrigin,
		"https://monogatari.diesw.tech",
		"https://diewehmut.github.io",
		"http://localhost:5173",
		"http://localhost:1420",
		"tauri://localhost",
		"http://tauri.localhost",
	}
	candidates = append(candidates, env.AllowedOrigins...)

	seen := make(map[string]struct{}, len(candidates))
	origins := make([]string, 0, len(candidates))
	for _, origin := range candidates {
		if origin == "" {
			continue
		}
		if _, exists := seen[origin]; exists {
			continue
		}
		seen[origin] = struct{}{}
		origins = append(origins, origin)
	}

	return origins
}
