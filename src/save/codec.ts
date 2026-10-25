import { DEFAULT_SEED } from '../data/game';
import { parseSave, SaveError, type SaveData } from './schema';

/**
 * Text save code for moving a save between devices:
 *   "GRA1z." + base64url(deflate-raw(JSON))  when CompressionStream is available,
 *   "GRA1j." + base64url(JSON)               otherwise.
 * Decoding accepts both (z requires DecompressionStream).
 */
const PREFIX_Z = 'GRA1z.';
const PREFIX_J = 'GRA1j.';

export interface CodecEnv {
  CompressionStream?: typeof CompressionStream;
  DecompressionStream?: typeof DecompressionStream;
}

const defaultEnv = (): CodecEnv => globalThis as unknown as CodecEnv;

function toB64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  let bin: string;
  try {
    bin = atob(b64);
  } catch {
    throw new SaveError('Save code is not valid base64');
  }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: GenericTransformStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export async function encodeSaveCode(
  data: SaveData,
  env: CodecEnv = defaultEnv(),
): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(data));
  if (env.CompressionStream) {
    return PREFIX_Z + toB64url(await pipe(json, new env.CompressionStream('deflate-raw')));
  }
  return PREFIX_J + toB64url(json);
}

export async function decodeSaveCode(
  code: string,
  env: CodecEnv = defaultEnv(),
): Promise<SaveData> {
  const c = code.trim().replace(/\s+/g, '');
  let bytes: Uint8Array;
  if (c.startsWith(PREFIX_Z)) {
    if (!env.DecompressionStream) throw new SaveError('This browser cannot read compressed codes');
    try {
      bytes = await pipe(
        fromB64url(c.slice(PREFIX_Z.length)),
        new env.DecompressionStream('deflate-raw'),
      );
    } catch (e) {
      if (e instanceof SaveError) throw e;
      throw new SaveError('Save code is damaged');
    }
  } else if (c.startsWith(PREFIX_J)) {
    bytes = fromB64url(c.slice(PREFIX_J.length));
  } else {
    throw new SaveError('Not a save code');
  }
  return parseSaveText(new TextDecoder().decode(bytes));
}

/** Parses save JSON text (file import or decoded code). */
export function parseSaveText(text: string): SaveData {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new SaveError('Save is not valid JSON');
  }
  return parseSave(obj, { seed: DEFAULT_SEED });
}

export function saveToJson(data: SaveData): string {
  return JSON.stringify(data, null, 2);
}
