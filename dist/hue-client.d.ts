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
export declare class HueClient {
    private bridgeIp;
    private apiKey;
    private baseUrl;
    constructor(bridgeIp: string, apiKey: string);
    /**
     * Get all lights from the bridge
     */
    getLights(): Promise<HueLight[]>;
    /**
     * Get a single light by ID
     */
    getLight(lightId: string): Promise<HueLight>;
    /**
     * Set the state of a light
     */
    setLightState(lightId: string, state: HueLightState): Promise<void>;
    /**
     * Set state for all lights
     */
    setAllLightsState(state: HueLightState): Promise<void>;
    /**
     * Convert hex color to Hue XY color space
     */
    static hexToXy(hex: string): [number, number];
    /**
     * Convert color name to hex
     */
    static colorNameToHex(name: string): string;
    /**
     * Convert color temperature string to mireds
     */
    static colorTempToMireds(temp: string): number;
}
//# sourceMappingURL=hue-client.d.ts.map