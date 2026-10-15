# ROBOTICS NEXUS

**Interactive 3D Robotics Lab — Created by Amir Saeid Dehghan**

A browser-based engineering laboratory for operating, inspecting and understanding five original robotic systems. Mechanical models are constructed procedurally with actual joint hierarchies, reusable geometry, local materials and component metadata.

**Repository:** https://github.com/saaeiddev/Robotics-Lab-3D
**GitHub Pages target:** https://saaeiddev.github.io/Robotics-Lab-3D/

The target URL is not a deployment-status claim. Check the latest [Actions run](https://github.com/saaeiddev/Robotics-Lab-3D/actions) and [verification record](docs/VERIFICATION.md) for executed checks and publishing status.

## The five systems

| System | Functionality |
|---|---|
| **NEXUS H–01 / Humanoid** | 17 limited rotary axes, individual controls, head rotation, shoulder/elbow/wrist/hip/knee/ankle motion, wave, handshake and kinematic walk demonstrations. |
| **AXIS R–06 / Industrial arm** | Six hierarchical revolute joints, forward kinematics, position-only CCD inverse kinematics, draggable horizontal target with height control, gripper, reachable pick-and-place cycle, working-envelope illustration. |
| **TERRA X–04 / Rover** | Manual differential steering, rotating wheels, obstacle guard, footprint-aware A* path planning, waypoints, path display, dynamic obstacle replanning and follow camera. |
| **DEXTER H–05 / Hand** | Five independently commanded coupled fingers, 15 modeled hinges, open/close/grasp, individual phalanx inspection, tendon rails, transparent and exploded views. |
| **SENSE P–06 / Perception** | LiDAR and ultrasonic geometric range rays, actual rendered virtual RGB/depth camera inset, stylized depth grid, simulated IMU orientation, and a linear spring force/torque demonstration. |

Every robot includes selectable and hover-highlighted components, technical descriptions, hide/isolate/restore controls and smooth assembly/disassembly. Exploded offsets belong to actual components; no unrelated decorative fragments are substituted.

## Operating the laboratory

1. Choose a robot in **Robot Systems** on the left. On phones, open **Controls**.
2. Drag the 3D view to orbit, scroll/pinch to zoom, or choose a camera preset in the bottom toolbar.
3. Use the sliders or robot-specific action buttons. **Play**, **Pause**, **Stop** and **Reset** are in the bottom toolbar.
4. Click a part, or choose it in the **Component Inspector**. Focus, hide, isolate and restore commands affect the selected geometry.
5. Open **Anatomy** or **Exploded view** to inspect the assembly. Motion controls are disabled while exploded so inspection does not fight the robot motion.
6. **Emergency Stop** immediately latches all simulated motion. It remains latched across robot selection. Use **Reset robot** to re-arm. Escape also stops the lab when a lesson dialog is not open. This is a simulation control, not a certified physical safety device.

### Robot-specific tips

- **Arm:** switch on *Inverse kinematics*. Drag the cyan target on its horizontal plane; use *Target Y* for height. The solver controls tool position, not full tool orientation. Turn IK off to use individual joints or pick-and-place.
- **Rover:** hold the directional buttons or W/A/S/D. Select NE/NW/SE or double-click clear terrain to set a waypoint. *Navigate to waypoint* starts the controller. A blocked destination returns an explicit status rather than driving through a wall. Adding an obstacle replans from the current position.
- **Hand:** select a finger and move *Finger flexion*. The three segment angles use 1 : 0.85 : 0.65 coupling. Open, close and grasp affect all five fingers.
- **Sensors:** select a modality and start the stream. RGB/depth render an additional virtual view of the same 3D scene. LiDAR/ultrasonic returns intersect the same obstacle rectangles shown in the lab.

## Intelligence and academy

**Robot Intelligence** connects Sensors → Perception → Planning → Control → Actuators → Feedback. Six topics cover computer vision, known-object labeling, planning, a one-step reward comparison, navigation and human–robot interaction. A live mini-map controls the same rover simulation as the 3D laboratory.

The **Robotics Academy** contains 15 concise lessons with visual explanations and links into the relevant robot system. It covers fundamentals, motors, actuators, DOF, FK/IK, sensors, feedback, control, machine learning, industry, medicine, autonomous vehicles, space and humanoids.

No animation is described as a trained AI model. Recognition boxes use known scene metadata. The reinforcement-learning panel demonstrates action reward comparisons; it does not run a trained policy or training loop.

## Technology

- React 19 and TypeScript
- Vite 7 with production base **`/Robotics-Lab-3D/`**
- Three.js, React Three Fiber and Drei
- Zustand for operator state and telemetry
- Lucide icons and locally bundled Space Grotesk variable font
- Purpose-built CSS for angular controls and responsive drawers
- Vitest, React Testing Library and Playwright acceptance tests

No backend, external model CDN, API key or account is needed to operate the site. Fonts and runtime code are bundled into `dist/`.

## Local development

Use Node.js 22 or a compatible supported release.

```bash
npm ci
npm run dev
```

Open `http://localhost:4173/Robotics-Lab-3D/`.

```bash
npm test                 # computational + DOM integration checks
npm run build            # strict TypeScript check and optimized Vite bundle
npm run check:dist       # verify production base paths and referenced assets
npm run preview          # serve the production build
```

Browser acceptance tests require Chromium:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

Browser tests are separate from Vitest. The Vitest UI suite deliberately mocks the Canvas boundary and does not establish WebGL correctness. Playwright tests exercise the real production bundle at desktop and mobile viewport sizes and capture evidence under `test-results/`.

## GitHub Pages deployment

The exact repository is **`saaeiddev/Robotics-Lab-3D`**. Do not rename it without updating `vite.config.ts` and all deployment references.

1. In this repository, select **Settings → Pages → Build and deployment → Source → GitHub Actions**. A repository administrator may need to enable Pages once; a normal workflow token cannot always perform initial enablement.
2. Push to `main`, or run **Build, test and deploy Robotics Nexus** from Actions.
3. The workflow installs locked dependencies, runs computational/DOM tests, builds the site, validates asset paths, installs Chromium on the CI runner, and executes desktop/mobile acceptance tests.
4. Only a successful build and acceptance suite can upload the Pages artifact and deploy it.
5. Browser screenshots, traces on failure and the HTML report are retained as the `browser-test-evidence` Actions artifact for 14 days.

The deployment job requests only `pages: write` and `id-token: write`; the build job has read-only repository contents access. No deployment secrets are committed.

## Architecture and simulation

- `src/engine/models.ts`: original mechanical geometry, parts, pivots, joint limits and materials.
- `src/engine/math.ts`: limited joint rotation, position-only CCD IK, footprint-aware A*, collision guard and range rays.
- `src/engine/simulation.ts`: deterministic motion stepping, pause/stop latch, gestures, payload attachment and rover controller.
- `src/Scene.tsx`: lighting, environment, interaction, cameras, sensor visuals, renderer quality and resource cleanup.
- `src/store.ts`: shared commands, system selection, inspection, safety state and sampled telemetry.
- `src/ui/Learning.tsx`: education, intelligence pipeline and live map.
- `tests/`: headless computational and DOM integration checks.
- `e2e/`: real browser acceptance checks against the production bundle.

Joint rotations are applied to actual parent-child transform nodes. The arm's tool position is read from its composed world transform. IK projects the target and end-effector vector onto each revolute joint plane and iterates signed corrections with mechanical limits. Singular or unreachable configurations report residual error rather than promise success.

The rover uses a 17×17 grid at 0.5 m spacing, eight-neighbor A*, a Euclidean heuristic, no diagonal corner cutting, and obstacle inflation. Planning has additional clearance above the collision guard. The controller aligns its heading before advancing through each waypoint. Pose is exact and map geometry is known.

The simulation integrates bounded frame deltas. Pause freezes demonstration time; stop retains pose; emergency stop latches joint, drive, scanning, gripper and assembly motion. Reset establishes a new deterministic initial state.

## Assets and licenses

All five robot models, the laboratory, procedural brushed material, component definitions, logo geometry and control graphics are original project source. No downloaded third-party robot models or unverified asset URLs are used. The models can be regenerated from the source and require no separate GLB files.

Project source and original geometry are MIT licensed; see [LICENSE](LICENSE). Dependencies retain their own licenses. Distributed notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `public/licenses/`. Space Grotesk is distributed under the SIL Open Font License. Lucide uses the ISC license.

## Performance and accessibility

One active robot is constructed at a time. Shared geometry/material caches reduce duplicate allocation; geometries, textures and materials are disposed on model changes. The 3D view is loaded through a separate bundle. Automatic quality lowers device pixel ratio when sustained frame time is high; explicit high and battery-saver settings are available. Reported FPS is measured, not a performance guarantee.

Keyboard labels, range inputs, active/disabled states, dialog focus trapping, touch camera gestures, collapsible small-screen panels, reduced-motion support, error boundaries and WebGL-loss messages are included. Reduced-motion disables automatic showcase rotation and camera transition interpolation; explicitly started educational motions remain user-controlled.

## Known limitations

- Educational kinematics, not a validated dynamics, contact, motor-control or balance simulator.
- Humanoid motion can exhibit foot slip; no force-based walking or self-collision solver.
- Arm IK targets position only. It does not guarantee orientation, collision avoidance or convergence for every target. The envelope is illustrative, not a certified reachable set.
- Pick-and-place attachment is kinematic; payload mass, grasp forces and friction are not solved.
- Rover pose and map are exact; there is no SLAM, suspension dynamics, noisy sensing or real terrain physics.
- Hand fingers use simplified tendon coupling and a three-segment thumb; this is not a biomechanical model.
- Sensor rays and the depth grid are simplified educational models. Force/torque uses an illustrative linear spring and fixed moment arm. No physical sensor data is collected.
- No trained vision, reinforcement-learning or language model is included.
- Actual iPhone Safari, Android Chrome and GPU-specific performance require physical-device testing. Automated viewport emulation is not a substitute for those checks.
- Initial GitHub Pages enablement may require repository administrator access. A successful local build alone does not establish live publication.

## Author

**Amir Saeid Dehghan**
Created by Amir Saeid Dehghan.
