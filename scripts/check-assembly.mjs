// Places every printable RK-1 part in the rocket and reports any interference at nominal and full gimbal deflection.
//   npm run cad:assembly
import { checkAssembly, POSES } from './cad/assembly.mjs';

const { issues, pairs, solids } = checkAssembly(POSES, (m) => console.log(m));
console.log(`${solids} solids, ${pairs} overlapping-box pairs tested over ${POSES.length} poses`);
if (issues.length) {
  for (const i of issues) console.log(`INTERFERENCE at (${i.pose.join(', ')}): ${i.a} / ${i.b} = ${i.mm3} mm3`);
  process.exit(1);
}
console.log('no interference');
