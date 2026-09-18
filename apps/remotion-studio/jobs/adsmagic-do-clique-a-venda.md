# Motion Spec · Adsmagic · Do clique à venda

Status: ANIMATIC_APPROVED → MOTION_IMPLEMENTATION

## Output
- Composition: `AdsmagicClickToSale`
- Duration: 18.0 s
- FPS: 30
- Frames: 540
- Canvas: 1920×1080
- Primary output: 16:9

## Creative lock
The approved image styleframes are the visual source of truth. Do not reconstruct them in Figma and do not replace them with generic SaaS UI. Magnific is a visual reference library only, not an asset source.

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
