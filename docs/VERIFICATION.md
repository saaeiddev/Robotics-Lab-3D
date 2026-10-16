# Verification record

Date: 2026-10-15

## Executed locally

- Locked dependency installation completed.
- Vitest: **45 tests passed** across two suites (34 mechanics/simulation tests; 11 operator-interface DOM integration tests).
- All five procedural models construct finite geometry and component registries.
- Humanoid model exposes 17 real revolute controls; wave, handshake and walk change articulated joint poses.
- Arm hierarchy, joint limits, reachable and unreachable IK targets, and payload transfer were exercised.
- A* paths were checked along their segments for collision clearance. The integrated rover reached its goal and replanned with a changed obstacle field.
- All five systems froze motion under emergency stop. Reset re-armed controls; the stop latch remained engaged when selecting another robot.
- Hand finger control, sensor stepping, exploded reassembly, hide and isolate behavior were exercised.
- UI tests exercised robot selection, command buttons, IK and gripper controls, sensor modules, inspection, camera presets, quality selection, academy navigation, intelligence controls and drawer state.
- Strict TypeScript check and Vite production build completed.
- Production asset checker validated the exact `/Robotics-Lab-3D/` prefix and file existence for bundled scripts, CSS and fonts.

The DOM suite mocks the 3D Canvas boundary. It does not verify rendering, touch gestures, CSS layout or GPU compatibility.

## Browser acceptance workflow

Real Chromium desktop (1440×1000) and mobile (390×844, touch emulation) tests are included in `e2e/lab.spec.ts`. They run against the production build in GitHub Actions. The workflow saves screenshots, the test report and failure traces as `browser-test-evidence`.

At initial source commit these CI browser tests have **not yet been observed running**. Do not treat their presence as a passing result. This record will be updated after observing the workflow.

Local browser preview was not run: the managed preview's required control-browser capability was unavailable. No claim is made about local visual QA or measured cross-device frame rate.

## Publication status at initial source commit

The exact repository exists and connected GitHub access allows source writes. GitHub Pages was not enabled at initial inspection. Initial Pages creation through the unauthenticated local REST client returned HTTP 401. The cloud browser was signed out of GitHub. The Actions workflow includes Pages configuration and deployment; its actual result must be checked before reporting the target URL live.

## Physical devices

Actual iPhone Safari, Android Chrome, macOS Safari and Windows GPU/browser combinations have not been tested. CI viewport emulation, if successful, is not physical-device certification.

## 2026-10-16 — Instrument workbench redesign

- Passed all 45 existing robotics and DOM integration tests after the layout and scene palette changes.
- Passed TypeScript/production build and GitHub Pages asset path validation.
- Updated the mobile acceptance flow to select a system in the new horizontal selector before opening its control drawer.
- Local browser/WebGL visual QA was unavailable in this environment. The existing GitHub Actions acceptance job remains configured to capture desktop/mobile browser evidence; this entry does not claim those checks have passed.
