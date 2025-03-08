# SkyLoom

A 3D web-based sandbox game where players build floating islands using elemental powers. Create your own skyborne worlds with a unique building system based on five core elements, all enhanced by modern technology within an immersive environment.

![SkyLoom](public/images/screenshot.png)

## Features

- **Immersive 3D Environment**: Built with Three.js and React for a fluid, interactive experience
- **Elemental Building System**: Create using five core elements with unique properties
- **Fluid Controls**: Graceful camera movements with intuitive navigation
- **Modern Aesthetics**: Clean, minimalist design with a focus on visual harmony

## Technical Stack

- **Three.js** for 3D rendering with WebGL
- **React** for UI components
- **TypeScript** for type-safe code
- **Vite** for fast development and optimized builds

## Controls

- **Mouse**: Look around
- **W/↑**: Forward
- **S/↓**: Backward
- **A/←**: Left
- **D/→**: Right
- **Space**: Up
- **Shift**: Down
- **F**: Boost Speed
- **B**: Toggle Building Mode
- **ESC**: Options Menu

## Building Mode

1. Press **B** to enter building mode
2. Select an element type
3. Click "Lock View" to start building
4. Left Click to place blocks
5. Right Click to remove blocks
6. Press **ESC** to return to the element selector

## Getting Started

### Prerequisites

- Node.js v18.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/skyloom.git
cd skyloom

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Project Structure

```
skyloom/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── game/         # Game-related components
│   │   └── ui/           # User interface components
│   ├── hooks/            # Custom React hooks
│   ├── systems/          # Game systems
│   │   ├── building/     # Building mechanics
│   │   └── elements/     # Element types and properties
│   ├── styles/           # CSS styles
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Entry point
├── .gitignore            # Git ignore file
├── index.html            # HTML entry point
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## Future Plans

- Multiplayer functionality
- More complex building interactions
- Procedural terrain generation
- Custom shader effects
- AI companions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with the amazing [Three.js](https://threejs.org/) library
- UI components powered by [React](https://reactjs.org/)
