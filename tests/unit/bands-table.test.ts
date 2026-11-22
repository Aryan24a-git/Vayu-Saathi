// Satisfies: TEST-001, REQ-003, REQ-004, D1
import { describe, it, expect } from 'vitest';
import {
  AQI_BANDS,
  findBandByAqi,
  findBandByPm25,
  escalateBand,
  getBandByOrdinal,
} from '../../src/domain/bands';

describe('AQI Bands Data & Escalation', () => {
  it('contains six contiguous bands defined as data', () => {
    expect(AQI_BANDS.length).toBe(6);
    expect(AQI_BANDS[0]?.key).toBe('good');
    expect(AQI_BANDS[1]?.key).toBe('moderate');
    expect(AQI_BANDS[2]?.key).toBe('usg');
    expect(AQI_BANDS[3]?.key).toBe('unhealthy');
    expect(AQI_BANDS[4]?.key).toBe('very_unhealthy');
    expect(AQI_BANDS[5]?.key).toBe('hazardous');
  });

  it('correctly maps AQI values to official bands', () => {
    expect(findBandByAqi(25).key).toBe('good');
    expect(findBandByAqi(75).key).toBe('moderate');
    expect(findBandByAqi(130).key).toBe('usg');
    expect(findBandByAqi(180).key).toBe('unhealthy');
    expect(findBandByAqi(250).key).toBe('very_unhealthy');
    expect(findBandByAqi(400).key).toBe('hazardous');
  });

  it('correctly maps PM2.5 concentrations to official bands', () => {
    expect(findBandByPm25(5.0).key).toBe('good');
    expect(findBandByPm25(20.0).key).toBe('moderate');
    expect(findBandByPm25(45.0).key).toBe('usg');
    expect(findBandByPm25(80.0).key).toBe('unhealthy');
    expect(findBandByPm25(150.0).key).toBe('very_unhealthy');
    expect(findBandByPm25(350.0).key).toBe('hazardous');
  });

  it('escalates bands and clamps strictly between ordinal 0 and 5', () => {
    const good = getBandByOrdinal(0);
    const escalatedBy2 = escalateBand(good, 2);
    expect(escalatedBy2.ordinal).toBe(2);
    expect(escalatedBy2.key).toBe('usg');

    // Clamping at upper bound (5)
    const escalatedHuge = escalateBand(good, 10);
    expect(escalatedHuge.ordinal).toBe(5);
    expect(escalatedHuge.key).toBe('hazardous');

    // Clamping at lower bound (0)
    const deEscalated = escalateBand(good, -5);
    expect(deEscalated.ordinal).toBe(0);
    expect(deEscalated.key).toBe('good');
  });
});
