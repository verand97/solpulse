/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_RPC_URL: string
  readonly VITE_DEXSCREENER_API_URL: string
  readonly VITE_SOLSCAN_URL: string
  readonly VITE_BUBBLEMAPS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
