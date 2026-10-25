// Minimal ambient types for the Node built-ins used by tests (the project has no @types/node on
// purpose – src/ is browser code). Vitest runs tests in Node, so these exist at runtime.
declare module 'node:fs' {
  export function readFileSync(path: URL | string): Uint8Array;
}
declare module 'node:zlib' {
  export function brotliDecompressSync(buf: Uint8Array): Uint8Array;
}
