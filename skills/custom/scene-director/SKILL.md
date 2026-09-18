---
name: scene-director
description: Converts communication intent into scene hierarchy, layer topology, rhythm, timing and motion direction before implementation
version: 1.2.0
---

# Scene Director

Use this skill before implementation whenever the scene needs creative direction.

## Define

Objective

Story function

Primary focus

Secondary focus

Entry strategy

Main action

Highlight moment

Exit strategy

Rhythm

Intensity

Motion personality

Camera strategy

Depth strategy

Typography strategy

Audio strategy when relevant

Implementation technique

Layer Map

Motion Causality Map

## Layer Map

Before implementation, identify the independently addressable parts of the scene:

- background/environment;
- primary foreground subject;
- secondary foreground objects;
- UI/product components;
- typography;
- cursor/pointer/interaction feedback;
- signal/path/glow elements;
- masks and occlusion layers.

For every major moving element, define its source and whether it is genuinely independent.

Do not accept a flattened full-scene raster as multiple layers merely because the implementation applies camera or depth effects to it.

## Cause and effect

Prefer motion that explains relationships between events.

For example, if an insight appears because a metric changed, animate the metric change before revealing the insight rather than making both elements appear independently.

When a recurring visual signal connects scenes, define what event activates it, what it connects and what state it communicates.

## Avoid generic motion

Every movement should support hierarchy, meaning or interaction feedback.

Do not add motion only to make the scene busier.

Do not use camera movement as a substitute for missing component motion when the story depends on independent objects changing, appearing, connecting or reacting.

## Template handoff

The Scene Director identifies the required implementation technique, but does not choose visuals from a template.

After Motion Direction is defined, pass the technique requirements to Template Resolution.

Examples:

- true 3D geometry or a real 3D camera can justify the official `three` template;
- a simple layered React product scene should normally remain on `blank`;
- glow, parallax or depth alone do not justify `three`;
- code animation can justify `code-hike`;
- Skia should be selected only when the rendering problem is genuinely Skia-specific.

The selected template must adapt to the approved scene. The scene must never be redesigned to resemble the template.
