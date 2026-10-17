import { build } from 'esbuild';
import { writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
const result=await build({entryPoints:{modern:'modern-entry.js'},outdir:'../../new/360',chunkNames:'renderer-chunks/[name]-[hash]',bundle:true,splitting:true,format:'esm',minify:true,write:false});
for(const file of result.outputFiles){
 const output=file.text.split('\n').map(line=>line.replace(/[ \t]+$/,'').replace(/^ +(?=\t)/,'')).join('\n');
 await mkdir(dirname(file.path),{recursive:true});await writeFile(file.path,output);
}

// This directory contains only generated renderer chunks. Drop superseded hashes.
const current=new Set(result.outputFiles.map(file=>file.path.split('/').pop()));
for(const name of await readdir('../../new/360/renderer-chunks')){
 if(/^(chunk|precision)-[A-Z0-9]+\.js$/.test(name)&&!current.has(name))await unlink('../../new/360/renderer-chunks/'+name);
}
