// Monocopter vane mixer (shared by firmware docs, tutorials and the 3D model).
//
// Body axes (aerospace FRD): X forward, Y right, Z down.
// Four vanes sit in the prop wash: 1 = front (+X), 2 = right (+Y), 3 = rear (-X), 4 = left (-Y).
// A positive deflection d_k produces a side force along the clockwise (seen from above) tangent t_k:
//   t1 = +Y, t2 = -X, t3 = -Y, t4 = +X
// Because the vanes act below the centre of gravity:
//   roll  torque  tau_x = -h (F1 - F3)
//   pitch torque  tau_y =  h (F4 - F2)
//   yaw   torque  tau_z =  r (F1 + F2 + F3 + F4)
// Solving with the common-mode ("collective") term set to zero gives:
//   d1 = yaw - roll   d3 = yaw + roll
//   d4 = yaw + pitch  d2 = yaw - pitch
// Inputs and outputs are normalised to [-1, 1] (output 1.0 == vaneMaxDeflection).

export const clamp = (v, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v));

export function mixMonocopter({ roll = 0, pitch = 0, yaw = 0 }) {
  const d1 = yaw - roll;
  const d2 = yaw - pitch;
  const d3 = yaw + roll;
  const d4 = yaw + pitch;
  // Saturation handling: scale all four down together so the mix ratio is preserved.
  const peak = Math.max(1, Math.abs(d1), Math.abs(d2), Math.abs(d3), Math.abs(d4));
  return [d1 / peak, d2 / peak, d3 / peak, d4 / peak];
}

// Tangent directions (x, z in three.js coordinates, where Y is up) for visualisation only.
// three.js mapping: X forward, Z right (aerospace Y), -Y down.
export const VANE_TANGENTS_XZ = [
  [0, 1],   // vane 1 front: force toward right (+Z)
  [-1, 0],  // vane 2 right: force toward rear (-X)
  [0, -1],  // vane 3 rear : force toward left (-Z)
  [1, 0],   // vane 4 left : force toward front (+X)
];
