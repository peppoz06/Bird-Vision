CRY4 – Bird Vision

CRY4 is an interactive visual experience inspired by the concept of a sixth sense and by scientific research on avian magnetoreception.
Many migratory birds are believed to perceive information from the Earth's magnetic field and use it for navigation across vast distances. While the exact biological mechanisms are still being investigated, some theories suggest that magnetic information may be integrated directly into the visual system.
CRY4 explores this possibility through a creative coding approach, imagining how the world might appear if humans could perceive magnetic orientation as part of their vision.
Rather than reproducing a scientifically accurate model, the project creates a speculative and perceptual interpretation of this phenomenon.


Concept

The project begins with a simple question:
How would our perception of reality change if we possessed a sensory channel capable of detecting the Earth's magnetic field?
Instead of visualizing magnetic data through conventional interfaces such as maps, compasses, or indicators, CRY4 transforms magnetic orientation into a perceptual experience.
The user is not given explicit information about where North is located.
Instead, North becomes a direction that can be intuitively sensed through subtle changes in the visual field.
The experience aims to create the feeling that an invisible force is constantly shaping perception and influencing how space is interpreted.


Vision

The visual output is generated from a live webcam feed processed in real time through custom GLSL shaders.
The image is continuously altered to suggest a perception that differs from ordinary human vision.
As the user aligns with the magnetic direction, the visual field becomes more coherent and stable. Moving away from it gradually introduces distortion, noise, and spatial instability.
This relationship creates a perceptual gradient rather than a binary state.
The image is never completely "correct" or "normal". Even in perfect alignment, the user remains immersed in an altered visual reality, suggesting the experience of another sensory system rather than the absence of an effect.


Bird-Inspired Perception

One of the visual inspirations behind the project is the ability of many bird species to perceive wavelengths beyond human vision, including portions of the ultraviolet spectrum.
To evoke this idea, CRY4 applies a custom color treatment based on:
Cyan
Deep blue
Violet
Magenta highlights
The goal is not to simulate ultraviolet vision accurately, but to suggest the presence of information that lies beyond normal human perception.
The resulting image should feel biological rather than digital, as if the user were temporarily borrowing a different sensory apparatus.


Technology

CRY4 is built using:
Vite
JavaScript
Three.js
GLSL
Webcam API
The webcam feed is used as a live texture and rendered through a fullscreen shader pipeline.


Interaction

CRY4 is primarily designed as a mobile experience.
The system uses the device's orientation sensors, including the magnetometer, compass, gyroscope, and GPS data, to estimate the user's position and heading relative to the Earth's magnetic field.
As the user rotates and moves through space, the visual field responds in real time, creating the sensation of navigating through an invisible magnetic landscape. The experience is intended to be explored physically, encouraging users to orient themselves with their bodies rather than through conventional interface elements.
A partial desktop version is also available for development and experimentation purposes. In this mode, the magnetic direction is simulated through mouse interaction: the cursor acts as a virtual North, allowing the visual language and perceptual behaviors to be tested without requiring mobile sensors.


Future Development

Future iterations of CRY4 will focus on strengthening the sensation of non-human perception and improving the relationship between the user and the surrounding environment.
Planned developments include:
- Expanding the visual language to further distance the experience from ordinary human vision.
- Improving the perception of magnetic direction, making the North feel more present and intuitively detectable without explicit indicators.
- Enhancing environmental mapping through LiDAR-based sensing, allowing the visual system to respond more accurately to the geometry and depth of the surrounding space.
- Optimizing performance and interaction design for mobile devices, where the project is intended to be fully experienced.
- Exploring immersive installation formats and spatial exhibition setups that can extend the experience beyond the smartphone screen and into physical environments.

These developments aim to reinforce the project's central goal: transforming magnetic orientation from abstract information into a tangible perceptual experience.










