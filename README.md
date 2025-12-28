# mcp-philips-hue

An MCP (Model Context Protocol) server for controlling Philips Hue smart lights.

## Features

- **get_lights** - List all lights connected to your Hue Bridge
- **set_brightness** - Adjust brightness (0-254) for individual or all lights
- **set_color** - Change colors using hex codes, color names, or color temperature
- **toggle_light** - Turn lights on or off

## Prerequisites

- Node.js 18+
- Philips Hue Bridge on your local network
- Hue API key (see setup below)

## Getting Your Hue API Key

1. Find your bridge IP at https://discovery.meethue.com/
2. Navigate to `http://<bridge-ip>/debug/clip.html`
3. Press the link button on your Hue Bridge
4. Within 30 seconds, POST to `/api` with body: `{"devicetype":"mcp-server#user"}`
5. Copy the `username` from the response - this is your API key

## Installation

```bash
cd mcp-philips-hue
npm install
npm run build
```

## Configuration

### Environment Variables

```bash
export HUE_BRIDGE_IP=192.168.1.x
export HUE_API_KEY=your-api-key-here
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "philips-hue": {
      "command": "node",
      "args": ["/path/to/philips-hue-mcp/dist/index.js"],
      "env": {
        "HUE_BRIDGE_IP": "192.168.1.x",
        "HUE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Usage Examples

### List all lights
```
get_lights
```

### Set brightness
```
set_brightness light_id="1" brightness=200
set_brightness light_id="all" brightness=100
```

### Set color
```
# Using hex color
set_color light_id="1" color="#FF0000"

# Using color name
set_color light_id="1" color="blue"

# Using color temperature
set_color light_id="1" color="warm"
set_color light_id="all" color="2700K"
```

### Toggle lights
```
toggle_light light_id="1" state=true
toggle_light light_id="all" state=false
```

## Color Options

### Named Colors
red, green, blue, yellow, orange, purple, pink, white, cyan, magenta

### Color Temperature
- `warm` (2200K)
- `soft` (2500K)
- `neutral` (3500K)
- `cool` (5000K)
- `daylight` (6500K)
- Or specify Kelvin directly: `2700K`, `4000K`, etc.

## Development

```bash
# Watch mode
npm run dev

# Run tests
npm test

# Build
npm run build
```

## Testing

```bash
npm test
```

## License

MIT

---

*Built autonomously by [GRIMLOCK](https://github.com/MatthewSnow2/grimlock) - Autonomous MCP Server Factory*
