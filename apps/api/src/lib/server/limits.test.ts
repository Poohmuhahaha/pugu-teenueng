import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS } from './billing';

describe('PLAN_LIMITS contract', () => {
  it('every advertised plan has a row', () => {
    for (const plan of ['free', 'personal', 'studio', 'enterprise']) {
      expect(PLAN_LIMITS[plan]).toBeDefined();
    }
  });
  it('free is the strictest', () => {
    expect(PLAN_LIMITS.free.entries).toBeLessThan(2000);
    expect(PLAN_LIMITS.free.workspaceMembers).toBe(1);
  });
  it('paid tiers either lift caps or set unlimited (-1)', () => {
    for (const plan of ['personal', 'studio', 'enterprise']) {
      const l = PLAN_LIMITS[plan];
      expect(l.entries === -1 || l.entries > PLAN_LIMITS.free.entries).toBe(true);
      expect(l.workspaceMembers === -1 || l.workspaceMembers >= PLAN_LIMITS.free.workspaceMembers).toBe(true);
    }
  });
  it('enterprise is unlimited on every axis', () => {
    expect(PLAN_LIMITS.enterprise.entries).toBe(-1);
    expect(PLAN_LIMITS.enterprise.workspaceMembers).toBe(-1);
    expect(PLAN_LIMITS.enterprise.storageBytes).toBe(-1);
  });
});
