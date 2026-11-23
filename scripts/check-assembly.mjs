// Places every printable part in each vehicle and reports any interference.
//   npm run cad:assembly
import { checkAssembly, POSES } from './cad/assembly.mjs';
import { checkMono, checkVaneInstall, VANE_POSES } from './cad/assembly-mono.mjs';

let bad = 0;
const rk = checkAssembly(POSES, () => {});
console.log(`RK-1: ${rk.solids} solids, ${rk.pairs} overlapping-box pairs over ${POSES.length} gimbal poses`);
for (const i of rk.issues) { bad++; console.log(`INTERFERENCE at (${i.pose.join(', ')}): ${i.a} / ${i.b} = ${i.mm3} mm3`); }
const mc = checkMono(VANE_POSES, () => {});
console.log(`MC-1: ${mc.solids} solids, ${mc.pairs} overlapping-box pairs over ${VANE_POSES.length} vane poses`);
for (const i of mc.issues) { bad++; console.log(`INTERFERENCE at vanes (${i.pose.join(', ')}): ${i.a} / ${i.b} = ${i.mm3} mm3`); }
const inst = checkVaneInstall();
for (const i of inst.issues) { bad++; console.log(`INSTALL: ${i.a} / ${i.b} = ${i.mm3} mm3`); }
console.log(bad ? `${bad} interference(s)` : 'no interference');
process.exit(bad ? 1 : 0);
