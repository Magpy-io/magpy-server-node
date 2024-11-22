import { performance } from 'perf_hooks';

export class Perf {
  private startTime: number | null;

  constructor() {
    this.startTime = null;
  }

  start() {
    this.startTime = performance.now();
  }

  end() {
    if (this.startTime == null) {
      return 0;
    }
    return performance.now() - this.startTime;
  }
}
