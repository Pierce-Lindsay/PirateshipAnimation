# PirateshipAnimation
Everybody loves pirates, right?

Final Project
Pierce Lindsay, Connor Bouffard

We created a pirate ship scene that displays a ship sailing through foggy waters with dynamic movement, 
and an interesting environment. The ship has a sail that deforms with the ships movement and a cannon 
that can be fired in direction based on its rotation. Clouds are procedurally generated in the background, 
particle systems for birds and fish cause animals to move through the scene with unique behaviors.

Features:
Splines – The pirate ship moves along a spline for its bobbing.
Slerping – The pirate ship uses slerping for the some of the rotations in the bob.
Quaternions – The cannons can be aimed using sliders below the canvas that use quaternions for rotations. 
The particles use quaternions to rotate in their direction of movement. The ship also rocks in the ocean and 
is rotated using quaternions.
Shape deformation – The sail of the pirate ship is acted upon non-uniformly to create a bending 
effect simulating being pushed by the wind.
Skeletal animation – The wings of the birds use forward kinematics and skeletal animation.
Hierarchical modeling – All models in the scene with multiple shapes use hierarchical modeling 
for their renderings and transformations such as the features on the birds, fish, and ship.
Physically based animation – The trajectory of the cannon balls will follow real world physics. 
The fish jump out of the water with simulated gravity.
Particle systems – The birds use boid behavior and object avoidance for flocking. 
The fish are more simple particles that randomly jump and start at random positions. 
The clouds are also handled as a simple particle system with random positions, shapes, and correct despawning.

User Interaction: the cannon can be rotated with the sliders and fired by clicking.
Running the program: To run the program, a web server is required to avoid cross origin errors. 
Besides this, it should be able to be opened, watched, and enjoyed.

Pierce’s Contributions:
Implemented environmental features: fog, background, particle systems and appearances 
(clouds, birds, fish). Some of the classes/functions for rendering, object hierarchies, transformations.

Connor’s contributions:
Implemented the ship and all the mechanics behind it. The cannons(physics, cannon balls, and user controls), 
sail deformation using shader, slerping, spline movement, and rocking of the ship.