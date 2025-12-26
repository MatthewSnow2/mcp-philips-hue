#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { HueClient } from './hue-client.js';
// Get configuration from environment
const BRIDGE_IP = process.env.HUE_BRIDGE_IP;
const API_KEY = process.env.HUE_API_KEY;
if (!BRIDGE_IP || !API_KEY) {
    console.error('Error: HUE_BRIDGE_IP and HUE_API_KEY environment variables are required');
    console.error('Set them in your MCP configuration or .env file');
    process.exit(1);
}
const hueClient = new HueClient(BRIDGE_IP, API_KEY);
// Create MCP server
const server = new Server({
    name: 'philips-hue-mcp',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_lights',
                description: 'List all lights connected to the Hue Bridge',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'set_brightness',
                description: 'Set light brightness level',
                inputSchema: {
                    type: 'object',
                    properties: {
                        light_id: {
                            type: 'string',
                            description: "Light ID or 'all' for all lights",
                        },
                        brightness: {
                            type: 'number',
                            description: 'Brightness level 0-254 (0=off, 254=max)',
                            minimum: 0,
                            maximum: 254,
                        },
                    },
                    required: ['light_id', 'brightness'],
                },
            },
            {
                name: 'set_color',
                description: 'Change light color using various color modes',
                inputSchema: {
                    type: 'object',
                    properties: {
                        light_id: {
                            type: 'string',
                            description: "Light ID or 'all' for all lights",
                        },
                        color: {
                            type: 'string',
                            description: 'Color as hex (#FF0000), name (red), or temperature (warm/cool/2700K)',
                        },
                    },
                    required: ['light_id', 'color'],
                },
            },
            {
                name: 'toggle_light',
                description: 'Turn light on or off',
                inputSchema: {
                    type: 'object',
                    properties: {
                        light_id: {
                            type: 'string',
                            description: "Light ID or 'all' for all lights",
                        },
                        state: {
                            type: 'boolean',
                            description: 'true=on, false=off',
                        },
                    },
                    required: ['light_id', 'state'],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'get_lights': {
                const lights = await hueClient.getLights();
                const formattedLights = lights.map((light) => ({
                    id: light.id,
                    name: light.name,
                    type: light.type,
                    state: {
                        on: light.state.on,
                        brightness: light.state.bri,
                        reachable: light.state.reachable,
                        colormode: light.state.colormode,
                    },
                }));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(formattedLights, null, 2),
                        },
                    ],
                };
            }
            case 'set_brightness': {
                const lightId = args?.light_id;
                const brightness = args?.brightness;
                if (brightness < 0 || brightness > 254) {
                    throw new Error('Brightness must be between 0 and 254');
                }
                if (lightId === 'all') {
                    await hueClient.setAllLightsState({ bri: brightness, on: brightness > 0 });
                }
                else {
                    await hueClient.setLightState(lightId, { bri: brightness, on: brightness > 0 });
                }
                // Get updated state
                const light = lightId === 'all'
                    ? { message: 'All lights updated', brightness }
                    : await hueClient.getLight(lightId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(light, null, 2),
                        },
                    ],
                };
            }
            case 'set_color': {
                const lightId = args?.light_id;
                const color = args?.color;
                let state = {};
                if (color.startsWith('#')) {
                    // Hex color
                    state.xy = HueClient.hexToXy(color);
                }
                else if (/^\d+K?$/i.test(color) || ['warm', 'soft', 'neutral', 'cool', 'daylight'].includes(color.toLowerCase())) {
                    // Color temperature
                    state.ct = HueClient.colorTempToMireds(color);
                }
                else {
                    // Color name
                    const hex = HueClient.colorNameToHex(color);
                    state.xy = HueClient.hexToXy(hex);
                }
                if (lightId === 'all') {
                    await hueClient.setAllLightsState({ ...state, on: true });
                }
                else {
                    await hueClient.setLightState(lightId, { ...state, on: true });
                }
                // Get updated state
                const light = lightId === 'all'
                    ? { message: 'All lights color updated', color }
                    : await hueClient.getLight(lightId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(light, null, 2),
                        },
                    ],
                };
            }
            case 'toggle_light': {
                const lightId = args?.light_id;
                const state = args?.state;
                if (lightId === 'all') {
                    await hueClient.setAllLightsState({ on: state });
                }
                else {
                    await hueClient.setLightState(lightId, { on: state });
                }
                // Get updated state
                const light = lightId === 'all'
                    ? { message: `All lights turned ${state ? 'on' : 'off'}` }
                    : await hueClient.getLight(lightId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(light, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Philips Hue MCP server running on stdio');
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map