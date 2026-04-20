import * as fs from "fs";
import * as path from "path";

let _mtime: string | null = null;

export function getKitsUpdated(): string {
  if (_mtime) return _mtime;
  try {
    const p = path.join(process.cwd(), "src/lib/data/kits.json");
    const stat = fs.statSync(p);
    _mtime = stat.mtime.toISOString().slice(0, 10);
  } catch {
    _mtime = new Date().toISOString().slice(0, 10);
  }
  return _mtime;
}
