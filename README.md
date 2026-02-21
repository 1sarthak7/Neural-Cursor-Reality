<div align="center">

# 🧠 Neural Cursor Reality

**Move your cursor. • Bend reality. • Make some noise.**

[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](#)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](#)

<br />

<img src="https://via.placeholder.com/800x450/09090b/00d2ff?text=+Drop+a+GIF+of+your+UI+Animations+Here+" alt="Neural Cursor Reality Demo" width="100%" style="border-radius: 12px;" />

<br />

*An immersive, audio-reactive WebGL experience. Built with custom GLSL shaders, 3D Perlin noise, and a mathematically smoothed magnetic UI.*

</div>

---

## ✨ The Experience

This project isn't just a static 3D model; it's a living, breathing digital environment that reacts to you and your surroundings. 

### 🧲 Fluid Magnetic UI & Animations
The interface bridges the gap between the 2D DOM and the 3D canvas:
* **Lerp-Driven Magnetism:** Hovering near the navigation controls (`Explore`, `Enter`, `Destroy`) seamlessly pulls the buttons toward your cursor using Linear Interpolation (Lerping), completely eliminating CSS jitter.
* **Expanding Hover States:** Built with Tailwind CSS, the buttons utilize `group-hover:scale-100` to trigger sleek, origin-centered radial fills when activated.
* **Cinematic Initialization:** A synchronized start overlay elegantly handles strict browser audio-autoplay policies, fading out smoothly only when the user initiates the neural sync.

### 🎛️ Audio-Reactive GLSL Shaders
* **Real-time Vertex Displacement:** The core icosahedron physically distorts based on audio frequencies captured dynamically via the Web Audio API.
* **Custom Fresnel Glow:** Advanced edge-lighting ensures the wireframe retains a premium, holographic look regardless of the background particles.

---

## 🚀 Quick Start (Local Server Required)

Because this project utilizes ES6 Modules (`import` statements) and accesses the microphone via the Web Audio API, **it will not work by simply double-clicking the `index.html` file.** It must be served over a local HTTP server.

### Method 1: VS Code (Recommended)
1. Clone this repository and open the folder in VS Code.
2. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
3. Right-click `index.html` and select **"Open with Live Server"**.

### Method 2: Python Terminal
If you have Python installed, simply open your terminal in the project directory and run:
```bash
python -m http.server 8000
