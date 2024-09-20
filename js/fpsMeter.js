class FPSMeter {
  constructor() {
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;
  }

  getFPS() {
    const now = performance.now();
    this.frameCount++;
    const deltaTime = now - this.lastTime;

    if (deltaTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }

    return this.fps;
  }
}
