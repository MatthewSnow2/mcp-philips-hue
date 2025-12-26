/**
 * Philips Hue Bridge API Client
 */

export interface HueLight {
  id: string;
  name: string;
  state: {
    on: boolean;
    bri: number;
    hue?: number;
    sat?: number;
    ct?: number;
    xy?: [number, number];
    colormode?: 'hs' | 'ct' | 'xy';
    reachable: boolean;
  };
  type: string;
  modelid: string;
}

export interface HueLightState {
  on?: boolean;
  bri?: number;
  hue?: number;
  sat?: number;
  ct?: number;
  xy?: [number, number];
}

export class HueClient {
  private bridgeIp: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(bridgeIp: string, apiKey: string) {
    this.bridgeIp = bridgeIp;
    this.apiKey = apiKey;
    this.baseUrl = `http://${bridgeIp}/api/${apiKey}`;
  }

  /**
   * Get all lights from the bridge
   */
  async getLights(): Promise<HueLight[]> {
    const response = await fetch(`${this.baseUrl}/lights`);
    if (!response.ok) {
      throw new Error(`Failed to get lights: ${response.statusText}`);
    }

    const data = await response.json() as Record<string, Omit<HueLight, 'id'>>;

    // Convert object to array with IDs
    return Object.entries(data).map(([id, light]) => ({
      id,
      ...light,
    }));
  }

  /**
   * Get a single light by ID
   */
  async getLight(lightId: string): Promise<HueLight> {
    const response = await fetch(`${this.baseUrl}/lights/${lightId}`);
    if (!response.ok) {
      throw new Error(`Failed to get light ${lightId}: ${response.statusText}`);
    }

    const light = await response.json() as Omit<HueLight, 'id'>;
    return { id: lightId, ...light };
  }

  /**
   * Set the state of a light
   */
  async setLightState(lightId: string, state: HueLightState): Promise<void> {
    const response = await fetch(`${this.baseUrl}/lights/${lightId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });

    if (!response.ok) {
      throw new Error(`Failed to set light state: ${response.statusText}`);
    }

    const result = await response.json();

    // Check for errors in response
    if (Array.isArray(result) && result.some((r: { error?: unknown }) => r.error)) {
      const errors = result.filter((r: { error?: unknown }) => r.error);
      throw new Error(`Hue API error: ${JSON.stringify(errors)}`);
    }
  }

  /**
   * Set state for all lights
   */
  async setAllLightsState(state: HueLightState): Promise<void> {
    // Use group 0 which represents all lights
    const response = await fetch(`${this.baseUrl}/groups/0/action`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });

    if (!response.ok) {
      throw new Error(`Failed to set all lights state: ${response.statusText}`);
    }
  }

  /**
   * Convert hex color to Hue XY color space
   */
  static hexToXy(hex: string): [number, number] {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Apply gamma correction
    const red = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    const green = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    const blue = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // Convert to XYZ
    const X = red * 0.4124 + green * 0.3576 + blue * 0.1805;
    const Y = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    const Z = red * 0.0193 + green * 0.1192 + blue * 0.9505;

    // Convert to xy
    const sum = X + Y + Z;
    if (sum === 0) {
      return [0.33, 0.33]; // Default white point
    }

    return [X / sum, Y / sum];
  }

  /**
   * Convert color name to hex
   */
  static colorNameToHex(name: string): string {
    const colors: Record<string, string> = {
      red: '#FF0000',
      green: '#00FF00',
      blue: '#0000FF',
      yellow: '#FFFF00',
      orange: '#FFA500',
      purple: '#800080',
      pink: '#FFC0CB',
      white: '#FFFFFF',
      cyan: '#00FFFF',
      magenta: '#FF00FF',
    };

    return colors[name.toLowerCase()] || '#FFFFFF';
  }

  /**
   * Convert color temperature string to mireds
   */
  static colorTempToMireds(temp: string): number {
    // Handle named temperatures
    const namedTemps: Record<string, number> = {
      warm: 454,      // 2200K
      soft: 400,      // 2500K
      neutral: 285,   // 3500K
      cool: 200,      // 5000K
      daylight: 153,  // 6500K
    };

    if (namedTemps[temp.toLowerCase()]) {
      return namedTemps[temp.toLowerCase()];
    }

    // Handle Kelvin values (e.g., "2700K")
    const kelvinMatch = temp.match(/^(\d+)K?$/i);
    if (kelvinMatch) {
      const kelvin = parseInt(kelvinMatch[1], 10);
      // Mireds = 1,000,000 / Kelvin
      // Hue supports 153 (6500K) to 500 (2000K)
      return Math.max(153, Math.min(500, Math.round(1000000 / kelvin)));
    }

    return 285; // Default to neutral
  }
}
