# Motion Spec · Adsmagic · Do clique à venda

Status: MOTION_IMPLEMENTATION → LOCAL_TEST

## Output
- Composition: `AdsmagicClickToSale`
- Duration: 18.0 s
- FPS: 30
- Frames: 540
- Canvas: 1920×1080
- Primary output: 16:9

## Creative lock
The approved styleframes are the visual source of truth for composition and fidelity, but they must not be animated as flattened full-scene images.

For the current implementation:
- Recreate text, shapes, signal paths, glows and other simple elements in React/SVG.
- Use user-provided transparent cut assets for complex foreground objects that should preserve their rendered appearance.
- Background plates may remain raster images when they are environmental scenery rather than the animated subject.
- Every major foreground object must be independently addressable and independently animated.
- Do not treat camera movement, zoom, parallax or Three.js applied to a flattened scene as layered motion.
- Do not return to Figma for Scene 1 reconstruction.

## Timeline
1. Hook: 0–60
2. Anúncio: 60–120
3. Clique para WhatsApp: 120–180
4. Conversa: 180–255
5. Contexto e evento: 255–330
6. Pedido confirmado: 330–405
7. Visão consolidada: 405–495
8. Encerramento: 495–540

## Motion direction
- Product film, not slide presentation.
- Continuous cinematic camera movement.
- Restrained push-ins, pull-backs and lateral drift.
- 7-frame cross dissolves around scene boundaries.
- No bouncing UI, no decorative particle storm, no generic kinetic typography.
- Preserve the green signal line already designed into the frames.
- Motion must reinforce continuity from ad → conversation → event → sale → consolidated view.


## Scene 1 · layered local test
Scene 1 is the first scene being rebuilt with true layer separation.

Composition: `AdsmagicScene1Layered`  
Duration: 60 frames / 2 s  
Canvas: 1920×1080 / 30 fps

Layer contract:
- raster background plate with laptop and atmosphere
- React headline: `Do clique` + `à venda.`
- independent transparent ad card asset
- independent cursor asset
- independent transparent WhatsApp card asset
- independent transparent tracking card asset
- React/SVG Green Signal with animated path and travelling point
- no full-scene bitmap used as the animated foreground

Local commands from repository root:

```bash
pnpm install
pnpm --filter @motion-agent/remotion-studio assets:scene1
pnpm --filter @motion-agent/remotion-studio studio:scene1
```

In Remotion Studio, choose `AdsmagicScene1Layered`.

Direct render:

```bash
pnpm --filter @motion-agent/remotion-studio render:scene1
pnpm --filter @motion-agent/remotion-studio still:scene1
```

Generated outputs:
- `apps/remotion-studio/out/adsmagic-scene1-layered.mp4`
- `apps/remotion-studio/out/adsmagic-scene1-layered-still.png`

Current gate: **LOCAL_TEST**.  
Do not mark the full 18 s motion as READY_FOR_HUMAN until the layered reconstruction is accepted scene by scene.

## QA gates
- Fidelity Critic
- Composition Critic
- Brand Critic
- AI Slop Critic
- Motion Critic
- Technical Validator

Any mandatory failure returns the render to READY_FOR_FIX.

## Publication blocker
Scene 7 contains demonstrative dashboard values. Replace or remove demonstrative numeric values before a public final render.
