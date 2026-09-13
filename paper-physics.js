/* Reduced-order elastic plate. Each mode solves m q'' + c q' + k q = F.
   Fixed substeps keep response independent of display refresh rate. Parameters
   are stock estimates, not measured constitutive data from the print shop. */
export class PaperDynamics {
  constructor({ gsm = 160, thicknessMm = 0.168, lengthMm = 297 } = {}) {
    this.mass = Math.max(0.04, gsm / 1000);
    const rigidity = Math.pow(thicknessMm / 0.168, 3);
    const span = Math.pow(297 / Math.max(40, lengthMm), 4);
    this.frequency = Math.min(22, Math.max(2.5, 7 * Math.sqrt(rigidity * span * 0.16 / this.mass)));
    this.modes = [1, 1.9, 3.2].map((ratio) => ({ q: 0, v: 0, omega: this.frequency * ratio }));
    this.remainder = 0;
  }
  impulse(strength = 0.5) {
    this.modes.forEach((mode, i) => { mode.v += strength / (i + 1); });
  }
  step(elapsed, force = 0) {
    const dt = 1 / 240;
    this.remainder += Math.min(0.05, Math.max(0, elapsed));
    while (this.remainder >= dt) {
      this.modes.forEach((mode, i) => {
        const acceleration = force / (this.mass * (i + 1)) - mode.omega ** 2 * mode.q - 0.58 * mode.omega * mode.v;
        mode.v += acceleration * dt;
        mode.q += mode.v * dt;
        // Bound the reduced model to small deflections; table contact is resolved by the mesh.
        if (Math.abs(mode.q) > 0.12 / (i + 1)) {
          mode.q = Math.sign(mode.q) * 0.12 / (i + 1);
          mode.v *= -0.12;
        }
      });
      this.remainder -= dt;
    }
    return this.modes.map((mode) => mode.q);
  }
}
