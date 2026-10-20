# 3D Graphics Sandbox

An interactive 3D particle simulation built with JavaScript and Three.js. This project explores real-time rendering, vector-based movement, collision detection, and user interaction.

## Features

- Interactive 3D scene with lighting, grid, and camera controls
- Moving spheres with randomized velocities
- Boundary detection and bouncing
- Basic sphere-to-sphere collision detection
- Add and remove spheres using buttons or keyboard shortcuts
- Pause and resume the simulation
- Adjust simulation speed
- Select spheres using mouse-based raycasting
- Highlight selected spheres
- Live Object Inspector displaying position and velocity

## Technologies

- JavaScript
- Three.js / WebGL
- HTML and CSS
- Vite

## How to Run

1. Clone this repository.
2. Open the project folder in a terminal.
3. Install dependencies:

   `npm install`

4. Start the development server:

   `npm run dev`

5. Open the local URL shown in your terminal.

## Controls

| Action | Control |
|---|---|
| Rotate camera | Left mouse drag |
| Zoom | Mouse wheel |
| Pan | Right mouse drag |
| Add sphere | A or Add Sphere button |
| Remove sphere | R or Remove Sphere button |
| Pause / Resume | Pause Simulation button |
| Adjust speed | Speed slider |
| Select sphere | Click a sphere |

## Implementation

The simulation uses object-oriented JavaScript to manage individual particles. Each sphere stores its own position, velocity, radius, geometry, and material.

Movement is updated using elapsed frame time. Raycasting is used to select objects, and the Object Inspector displays their properties in real time.

Sphere collisions use a simplified velocity-swapping response rather than a fully realistic physics model.
