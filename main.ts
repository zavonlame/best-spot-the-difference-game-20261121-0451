// Hands Twin Streets in for the make.fun bounty.
// The game itself is plain static files under game/ (index.html plus ES modules,
// nothing fetched from the network), so this program only has to gather them:
// copy game/ and screenshots/ into the output directory and write the dossier
// the judge reads, using the vendored make.fun library.
//
// Run it from this directory:
//   node main.ts
// To choose the output directory instead of /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// And to play the game first:
//   node serve.ts   (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** The scorer's caps, mirrored here so a bad entry fails early, at home. */
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyIntoOut(name) {
  const source = join(repoRoot, name);
  if (!existsSync(source)) return;
  cpSync(source, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyIntoOut('game');
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
copyIntoOut('screenshots');

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, CAPS));
