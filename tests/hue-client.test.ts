import { describe, it, expect } from 'vitest';
import { HueClient } from '../src/hue-client.js';

describe('HueClient', () => {
  describe('hexToXy', () => {
    it('should convert red to xy', () => {
      const [x, y] = HueClient.hexToXy('#FF0000');
      expect(x).toBeCloseTo(0.64, 1);
      expect(y).toBeCloseTo(0.33, 1);
    });

    it('should convert green to xy', () => {
      const [x, y] = HueClient.hexToXy('#00FF00');
      expect(x).toBeCloseTo(0.3, 1);
      expect(y).toBeCloseTo(0.6, 1);
    });

    it('should convert blue to xy', () => {
      const [x, y] = HueClient.hexToXy('#0000FF');
      expect(x).toBeCloseTo(0.15, 1);
      expect(y).toBeCloseTo(0.06, 1);
    });

    it('should handle hex without #', () => {
      const [x, y] = HueClient.hexToXy('FF0000');
      expect(x).toBeCloseTo(0.64, 1);
      expect(y).toBeCloseTo(0.33, 1);
    });

    it('should handle white', () => {
      const [x, y] = HueClient.hexToXy('#FFFFFF');
      expect(x).toBeCloseTo(0.33, 1);
      expect(y).toBeCloseTo(0.33, 1);
    });
  });

  describe('colorNameToHex', () => {
    it('should convert red', () => {
      expect(HueClient.colorNameToHex('red')).toBe('#FF0000');
    });

    it('should convert green', () => {
      expect(HueClient.colorNameToHex('green')).toBe('#00FF00');
    });

    it('should convert blue', () => {
      expect(HueClient.colorNameToHex('blue')).toBe('#0000FF');
    });

    it('should be case insensitive', () => {
      expect(HueClient.colorNameToHex('RED')).toBe('#FF0000');
      expect(HueClient.colorNameToHex('Red')).toBe('#FF0000');
    });

    it('should default to white for unknown colors', () => {
      expect(HueClient.colorNameToHex('unknown')).toBe('#FFFFFF');
    });
  });

  describe('colorTempToMireds', () => {
    it('should convert warm to mireds', () => {
      expect(HueClient.colorTempToMireds('warm')).toBe(454);
    });

    it('should convert cool to mireds', () => {
      expect(HueClient.colorTempToMireds('cool')).toBe(200);
    });

    it('should convert Kelvin values', () => {
      expect(HueClient.colorTempToMireds('2700K')).toBe(370);
      expect(HueClient.colorTempToMireds('4000K')).toBe(250);
      expect(HueClient.colorTempToMireds('6500K')).toBe(154);
    });

    it('should handle Kelvin without K suffix', () => {
      expect(HueClient.colorTempToMireds('2700')).toBe(370);
    });

    it('should clamp to valid Hue range', () => {
      // Very high Kelvin should clamp to 153
      expect(HueClient.colorTempToMireds('10000K')).toBe(153);
      // Very low Kelvin should clamp to 500
      expect(HueClient.colorTempToMireds('1500K')).toBe(500);
    });

    it('should be case insensitive', () => {
      expect(HueClient.colorTempToMireds('WARM')).toBe(454);
      expect(HueClient.colorTempToMireds('Warm')).toBe(454);
    });
  });
});
