import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, '../../data/store.json');

export function readStore() {
  const raw = fs.readFileSync(storePath, 'utf-8');
  return JSON.parse(raw);
}

export function writeStore(data) {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

export function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
