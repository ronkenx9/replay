interface ImportMetaEnv {
  readonly VITE_REPLAY_API_BASE_URL?: string;
  /** Vite-provided public base path ("/" in dev, "/replay/" on GitHub Pages builds). */
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
