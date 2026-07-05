declare module "fs/promises" {
  export function readFile(path: string | URL, encoding: BufferEncoding): Promise<string>;
  export function readFile(path: string | URL): Promise<Buffer>;
  export function readdir(path: string | URL): Promise<string[]>;
  export function access(path: string | URL): Promise<void>;
  export function mkdir(path: string | URL, options?: { recursive?: boolean }): Promise<string | undefined>;
  export function writeFile(path: string | URL, data: string | Uint8Array, options?: BufferEncoding | { encoding?: BufferEncoding }): Promise<void>;
}

declare module "node:fs/promises" {
  export * from "fs/promises";
}
