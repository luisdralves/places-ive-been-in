// / <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_DAY: string;
  readonly VITE_MAPBOX_NIGHT: string;
  readonly VITE_MAPBOX_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
