# Neon Snake

A modern, high-intensity Neon Snake game built with React, TypeScript, and Vite. This project recreates classic arcade gameplay with a vibrant neon aesthetic, procedural sound effects, and challenging difficulty modes.

## Features

- **Vibrant Neon Aesthetic**: Dark mode with glowing neon colors for the snake, food, and power-ups.
- **Procedural Audio**: 
  - Dynamic synth background music that adapts to the game state and difficulty.
  - Interactive sound effects for eating, power-ups, and game over.
- **Difficulty Modes**:
  - **EASY**: Relaxed pace for casual play.
  - **NORMAL**: The standard balanced experience.
  - **INSANE**: High-speed movement for the ultimate challenge.
- **Power-Ups**:
  - **Speed Boost**: Temporarily increases snake speed.
  - **2X Multiplier**: Double points for every food item eaten while active.
- **Visual Effects**:
  - Intense Glitch Death Effect with screen shake and red alerts.
  - Real-time status timers for active power-ups.
- **High Score Tracking**: Persistent high scores saved locally for each difficulty level.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lakshay-lg/neon-snake.git
   cd neon-snake
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## Controls

- **Movement**: Use `Arrow Keys` or `WASD`.
- **Start/Restart**: Press any key to start or click the **RESTART** button.
- **Difficulty Selection**: Select your preferred difficulty on the start or game-over screen.

## Technical Details

- [React](https://reactjs.org/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Procedural sound and music

## License

This project is open-source and available under the [MIT License](LICENSE).
