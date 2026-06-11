const DEFAULT_API_BASE_URL = "http://localhost:4174";
function configuredApiBaseUrl() {
    return import.meta.env.VITE_REPLAY_API_BASE_URL || DEFAULT_API_BASE_URL;
}
export function replayApiUrl(path, baseUrl = configuredApiBaseUrl()) {
    const base = baseUrl.replace(/\/+$/, "");
    const suffix = path.startsWith("/") ? path : `/${path}`;
    return `${base}${suffix}`;
}
//# sourceMappingURL=api.js.map