const a = -0.00000506239;
const b = 0.0238843;
const c = -6.4921;

export const latitudeOffsetFromHeight = (height: number) => {
  return a * height ** 2 + b * height + c;
};
