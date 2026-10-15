import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
const result=await build({entryPoints:['modern-entry.js'],bundle:true,format:'esm',minify:true,write:false});
// Bundled shader template literals contain insignificant trailing/indent whitespace.
// Normalize it so the reproducible generated asset passes the repository diff check.
const output=result.outputFiles[0].text.split('\n').map(line=>line.replace(/[ \t]+$/,'').replace(/^ +(?=\t)/,'')).join('\n');
await writeFile('../../new/360/modern.js',output);
