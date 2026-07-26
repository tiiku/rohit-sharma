# AI Agent Prompt — Create a Heidelberg CCUS Style Particle Experience (Cricket Edition)

## Objective

Create an **award-winning cinematic WebGL experience** for a Next.js website that recreates the **look, feel, interaction quality, camera movement, particle behaviour, and immersive navigation style** of the Heidelberg Materials CCUS Experience.

**Reference Inspiration**

**[https://ccus.heidelbergmaterials.com/](https://ccus.heidelbergmaterials.com/)**

The goal is **not to copy assets, branding, colours, text, or content**, but to recreate the same level of immersion, smoothness, and technical execution using an original cricket theme. The inspiration is the interaction design, not the proprietary creative assets. ([Communication Arts][1])

---

# Overall Experience

The website should feel like travelling through a living universe made entirely from particles.

There should never be obvious page transitions.

Instead, the visitor continuously moves through space.

The website consists of:

* one fullscreen WebGL canvas
* one continuous camera path
* one particle simulation
* one scroll-driven cinematic timeline

Scrolling should feel like flying deeper into a particle galaxy.

---

# Core Interaction

Exactly like the CCUS Experience:

Instead of switching sections:

* camera travels
* particles reorganize
* new object appears
* camera flies into it
* particles dissolve
* next object forms

Everything happens continuously.

No page reloads.

No scene cuts.

No fade transitions.

No section snapping.

Only one continuous cinematic experience.

---

# Camera Behaviour

Replicate the cinematic movement style.

Camera should:

* slowly accelerate
* slightly overshoot
* ease naturally
* never stop abruptly
* always feel alive

The camera should physically travel through the particle clouds.

When approaching an object:

* slowly zoom
* move inside
* pass through the particle formation
* emerge into the next environment

Movement should feel like a drone flying through a galaxy.

---

# Particle World

Create two particle systems.

## Background Universe

Around 100,000 tiny particles.

Behaviour:

* floating
* drifting
* rotating
* depth
* parallax
* subtle turbulence

Never static.

Should resemble stars floating in space.

---

## Main Morphing Particles

20,000–40,000 GPU-instanced particles.

Particles should continuously

* vibrate
* breathe
* orbit slightly
* move with simplex noise
* respond to mouse movement

Even while forming an object they should remain alive.

No frozen particles.

---

# Morph Sequence

Morph between these objects:

1. Random particle cloud

↓

2. Cricket Bat

↓

Camera flies inside bat

↓

3. Cricket Ball

↓

Camera passes through ball seam

↓

4. Cricket Helmet

↓

Camera enters visor opening

↓

5. Cricket Stumps

↓

Camera flies between stumps

↓

6. Cricket Bails

↓

Camera passes underneath

↓

7. ICC Cricket World Cup Trophy

↓

Large cinematic reveal

↓

Particles slowly disperse

↓

Infinite floating particle universe

---

# Particle Morphing

DO NOT replace meshes.

Every particle must keep its identity.

Morph by interpolating particle positions.

Use

MeshSurfaceSampler

to sample

20k–40k points

from every GLB model.

Store target positions for each model.

Interpolate smoothly.

---

# Scroll Timeline

Use:

* Lenis
* GSAP ScrollTrigger
* Pinned canvas

Scroll controls a single master timeline.

Timeline example:

0%

Random galaxy

10%

Bat appears

25%

Fly into bat

35%

Ball appears

50%

Helmet

65%

Stumps

80%

Bails

100%

World Cup Trophy

No independent animations.

Everything is driven by scroll progress.

---

# Mouse Interaction

Exactly like premium WebGL experiences.

Mouse slightly affects particles.

Nearby particles

* repel
* swirl
* slowly return

Interaction should never destroy the object's shape.

---

# Visual Style

Inspired by Heidelberg CCUS.

Dark environment.

Soft atmospheric fog.

Deep depth.

Particles glow softly.

Very minimal lighting.

Premium cinematic feeling.

Colours:

Background

#030303

Primary particles

#A7FF70

Accent

#557133

Soft fog

rgba(85,113,51,.15)

Bloom should be subtle.

No excessive glow.

---

# Shader Requirements

Create custom GLSL shaders.

Vertex Shader

* simplex noise
* turbulence
* breathing
* morph interpolation
* camera distance scaling
* particle size variation

Fragment Shader

* soft circles
* additive blending
* radial falloff
* smooth alpha
* glowing edges

---

# Performance Requirements

Maintain

60 FPS

on average laptops.

Required optimizations:

* InstancedBufferGeometry
* GPU instancing
* ShaderMaterial
* Minimal React re-renders
* Dynamic imports
* Frustum culling
* Efficient memory management
* Dispose all resources correctly
* No CPU particle simulation

---

# Code Architecture

Next.js 15

React 19

TypeScript

React Three Fiber

Three.js

Drei

GSAP

Lenis

Use reusable components.

No monolithic files.

Suggested structure:

```text
app/

components/
  Scene/
  CameraRig/
  ParticleUniverse/
  MorphSystem/
  ScrollTimeline/
  MouseField/
  BackgroundParticles/

hooks/
  useMorph.ts
  useTimeline.ts

lib/
  meshSampler.ts
  shaders.ts
  particleEngine.ts
  noise.ts

public/models/
  bat.glb
  ball.glb
  helmet.glb
  stumps.glb
  bails.glb
  worldcup.glb
```

---

# Quality Target

The final result should feel comparable to the Heidelberg Materials CCUS Experience in terms of smoothness, immersion, particle quality, and cinematic storytelling, while remaining entirely original in its content and visual identity. The user should feel as though they are travelling through a living particle universe where cricket-themed objects naturally emerge, dissolve, and transform as the camera flies through them, with fluid scroll-driven motion, GPU-accelerated particles, and a polished, award-worthy level of interaction. ([Communication Arts][1])

[1]: https://www.commarts.com/webpicks/heidelberg-materials?utm_source=chatgpt.com "Heidelberg Materials | Communication Arts"
