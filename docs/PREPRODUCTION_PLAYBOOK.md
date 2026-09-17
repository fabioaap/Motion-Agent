# Motion Design Preproduction Playbook

## Purpose

This playbook defines the mandatory creative process before any Remotion or animation build begins.

The core principle is simple: animation is not the place to discover the story or the visual language. Story, art direction, composition and key visual frames must exist first. Motion gives time, rhythm and behavior to an already directed visual system.

## Research basis

This workflow consolidates recurring professional practices documented by School of Motion, Motionographer and Adobe.

Primary references:

* School of Motion, Motion Design Project Workflow
  https://connect.schoolofmotion.com/hubfs/Email%20Images/Bring%20Your%20Ideas%20To%20Life%20Workshop/Bring_Your_Ideas_To_Life.pdf
* School of Motion, A Guide to Completing Your Motion Design Project
  https://schoolofmotion.com/blog/guide-completing-motion-design-project
* School of Motion, Explainer Camp
  https://schoolofmotion.com/courses/explainer-camp
* School of Motion, Motion Design Industry Roles and Responsibilities
  https://schoolofmotion.com/blog/motion-design-industry-roles-responsibilities
* Motionographer, 5 Questions To Consider When Creating Styleframes
  https://motionographer.com/2023/06/15/5-storytelling-questions-to-consider-when-creating-styleframes/
* Motionographer, Design for Motion interview
  https://motionographer.com/2015/12/16/author-of-design-for-motion-talks-industry-education-and-the-state-of-design/
* Adobe, After Effects Workflows
  https://helpx.adobe.com/after-effects/desktop/get-started/understand-after-effects-workflow/workflows.html

## Mandatory production order

### Phase 0 · Intake and constraints

The Motion Director must understand the communication problem before proposing visuals.

Required information:

* objective
* single primary message
* audience
* platform and aspect ratios
* desired duration
* CTA or expected viewer action
* brand constraints
* available product screens, assets and source files
* references supplied by the user
* references that should be researched
* desired feeling and tone
* visual or motion directions to avoid
* audio requirements

If important information is missing, ask at most four high impact questions per round.

A request that is technically detailed is not automatically creatively ready.

### Phase 1 · Creative brief

Normalize the request into a short creative brief.

The brief must answer:

* What must the viewer understand?
* What should the viewer feel?
* What should the viewer do next?
* What evidence must appear on screen?
* What claims or product behavior must not be invented?

Gate: no script until the communication objective is coherent.

### Phase 2 · Script with visual descriptions

Write the script before designing or animating.

The script must contain, per beat or scene:

* time range or approximate duration
* narration, dialogue or on screen copy
* narrative purpose
* visual description
* evidence or product asset required
* transition intent

The visual description must communicate context, not animation implementation details.

Example distinction:

Good visual description: "A campanha appears isolated on the left while the WhatsApp conversation appears separated on the right, making the disconnect visible."

Too early: "Move the card 84 pixels with cubic bezier easing."

Gate: script must be accepted before visual direction becomes production work.

### Phase 3 · Art direction and reference research

The Art Director converts strategy, brand and story into a visual roadmap.

Responsibilities:

* research references
* build a moodboard or reference board
* identify visual metaphors
* define composition principles
* define typography behavior
* define color hierarchy
* define image treatment
* define product UI treatment
* define spatial language and depth
* define texture, lighting and graphic language when relevant
* define what the piece must not look like

When direction is not supplied, propose two or three distinct art direction routes rather than silently choosing one.

Each route must explain what it communicates and why it fits the brief.

Gate: choose one visual route before polished frames are produced.

### Phase 4 · Storyboard and rough boards

Create a rough sequence of frames that validates storytelling and shot order.

The storyboard can be low fidelity. Its job is to validate:

* scene sequence
* information hierarchy
* visual continuity
* transitions as ideas
* relationship between copy and image
* beginning, middle and end

Do not spend final design effort here.

Gate: the story must read correctly in still images before visual polish.

### Phase 5 · Styleframes and key visual frames

Create polished still frames for the most important moments.

In this playbook, "key visual frames" means representative designed stills used to define the final look. They are not technical animation keyframes.

For ChatGPT driven workflows, these frames may be generated or edited with image generation after the art direction is approved.

At minimum produce:

* opening or hook frame
* representative middle frame
* hero or proof frame
* closing or CTA frame

Complex pieces may require a full design board for every major scene.

Styleframes must resolve:

* composition
* typography
* color
* hierarchy
* asset treatment
* product screen framing
* graphic devices
* spatial logic
* brand fidelity

Gate: no Remotion build until the visual language is understandable from still frames alone.

### Phase 6 · Animatic and timing

Turn the storyboard or styleframes into a rough timed video.

Use temporary voiceover, music or sound when relevant.

The animatic must validate:

* total duration
* pacing
* reading time
* scene duration
* transition timing
* synchronization with narration or music

This is the cheapest stage to discover that a scene is too long, too dense or unnecessary.

Gate: timing must be coherent before detailed motion implementation.

### Phase 7 · Motion direction

Only now define how the visual system behaves through time.

Define:

* motion personality
* rhythm
* entry and exit families
* camera behavior
* depth behavior
* typography motion
* focus hierarchy
* transition families
* interaction with audio
* reduced motion strategy when relevant

The Motion Designer should animate the approved design, not redesign it accidentally during motion implementation.

### Phase 8 · Motion specification

Translate the approved direction into implementation ready behavior.

Define scene durations, motion families, sequencing, focus moments and technical constraints.

Implementation parameters such as easing values, spring settings and frame exactness belong here, not in the early creative conversation.

### Phase 9 · Build

Build in Remotion or the selected motion engine only after all upstream gates are satisfied.

The build must reuse approved assets and frames wherever possible.

### Phase 10 · QA and correction

Run independent checks for:

* narrative fidelity
* art direction fidelity
* brand fidelity
* composition
* motion quality
* technical correctness
* cross format adaptation
* asset integrity
* regressions

A vertical version must be recomposed for the vertical canvas rather than mechanically cropped from the horizontal version.

### Phase 11 · Human approval and final render

Human approval is required before final delivery or publication unless the user explicitly delegated final approval.

## Roles

### Creative or Strategy Lead

Owns objective, audience, message, CTA and business context.

### Art Director

Translates strategy and brand into the visual roadmap. Owns reference direction, moodboard, visual metaphor, look and coherence.

### Graphic or Visual Designer

Turns the art direction into storyboard refinements, styleframes and design boards. Owns composition, typography, hierarchy, color and static visual craft.

### Motion Designer or Animator

Turns approved visual frames into time based behavior. Owns rhythm, timing, transitions, continuity and animation craft.

### Sound and Voice

Owns narration, music, sound effects and audio mix when required.

### QA and Brand Review

Must be independent from the builder when possible and can block delivery for major visual, brand or technical issues.

## Mandatory @motion behavior

The Motion Director must not jump from a user prompt directly into Remotion code.

If an approved script does not exist, create or validate the script first.

If approved art direction does not exist, run art direction discovery before motion direction.

If approved key visual frames do not exist, create or request them before build.

If timing is materially important, create an animatic before build.

Even in autonomous mode, these artifacts must be produced in sequence. Autonomous mode can reduce human checkpoints but cannot remove creative preproduction.

## Intake question policy

Ask only questions that materially change the work, but do not confuse a detailed technical request with a complete creative brief.

First round priorities:

1. What is the single message and desired viewer action?
2. Who is the audience and where will the piece be published?
3. What should the piece feel like and what references represent that feeling?
4. Which real assets, screens and product truths must appear?

Second round, only if necessary:

1. Which proposed art direction route should be used?
2. Is there voiceover, on screen copy, music or silence?
3. What visual or brand treatments are prohibited?
4. Which frames or moments require explicit human approval before animation?

## Definition of ready for animation

A job is ready for animation only when the following are available or explicitly waived:

* approved creative brief
* approved script
* chosen art direction
* storyboard or equivalent scene plan
* approved key visual frames or design boards
* timing plan or animatic
* verified source assets
* motion direction

If any mandatory item is missing, the system must remain in preproduction rather than entering BUILDING.
