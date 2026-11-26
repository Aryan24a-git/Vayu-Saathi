import { getEnv } from '../config/env';

export class DailyCallBudget {
  private calls = 0;
  private day = '';

  constructor(private readonly cap = getEnv().LLM_DAILY_CALL_CAP) {}

  tryReserve(now: Date = new Date()): boolean {
    const day = now.toISOString().slice(0, 10);
    if (this.day !== day) {
      this.day = day;
      this.calls = 0;
    }
    if (this.calls >= this.cap) return false;
    this.calls += 1;
    return true;
  }

  get used(): number {
    return this.calls;
  }
}
