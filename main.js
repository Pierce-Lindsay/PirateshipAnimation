//to avoid cross origin error, must be used with web server, you can use webstorm

import {Renderable, initRenderer, setCam, setProj} from './modules/Renderable.js';
import {Camera, Projection, Transform} from './modules/Transformer.js';
import {createCube, Spline, convertFromEulertoQuanterion, slerp} from './modules/Shape.js';
import {Obj, objects, deleteObject} from "./modules/Object.js"
import {Bone, Skeleton} from './modules/Skeleton.js';
import {createCharacterFeature, Bird, fishies, birds, BoundingSphere, obstacles, spawnFlock, Wing, spawnFish} from "./modules/Animals.js";

//globals

let canvas;
let gl;

//delta time globals
let lastTime = 0;

let twoSecTimer = 0;
let elapsedTime = 0;
let cam = null;
let projection = null;

const CUBE_VERTS = createCube()[0];

const RED = vec4(0.9, 0.1, 0.1, 1.0);
const ORIGIN = vec3(0, 0, 0)
const NORMAL_SCALE = vec3(1, 1,1);


const FOV = 90;
const NEAR = 0.1;
const FAR = 10
const ASPECT = 1.0;
//returns bool, just takes in the pos


//initializes mains global vars and calls neccessary init functions
function initializeGlobals()
{
    canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas, undefined);
    // exit if failed to get context
    if (!gl)
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    cam = new Camera(vec3(0, 2, 2), vec3(0, 2, 0), vec3(0, 1, 0))
    projection = new Projection(FOV, ASPECT, NEAR, FAR)

    //init renderer
    initRenderer(gl, cam, projection)
    //default normal, basically does nothing
    //init default viewports and gl stuff
    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.cullFace(gl.BACK)
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST);

    //make the shapes and renderables we need







    //just to prove everything is working(not important at all)
    let o1 = createCharacterFeature(null, RED, structuredClone(CUBE_VERTS), vec3(0, 1, 0), scale(1, NORMAL_SCALE), 0, vec3(0, 0, 1));
    let bound = new BoundingSphere(o1);





    let floor = createCharacterFeature(null, vec4(0, 0, 1, 1), structuredClone(CUBE_VERTS), vec3(0, 0.95, 0), vec3(50, 0.05, 50), 0, vec3(0, 0, 1));
        objects.push(floor)

    objects.push(o1);
}


//clears background with clear color and then renders if our renderer is active and has things to draw
function drawStuff()
{
    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas> by clearning the color buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //draw
        for(let i =0; i < objects.length; i++) {
            objects[i].drawAll();
        }
}

//recursive draw function
function animate()
{
    let now = new Date();
    let time = now.getMilliseconds()/1000 + now.getSeconds();
    let deltaTime = time-lastTime;

    //check for rollback
    if(deltaTime <= 0)
        deltaTime = 0.0;
    lastTime = time;

    twoSecTimer += deltaTime;
    elapsedTime += deltaTime;

    if(twoSecTimer > 6)
    {
        spawnFlock(projection, cam.eye)
        spawnFish(projection, cam.eye);
        twoSecTimer = 0;
    }

   // w1.animate(elapsedTime)


    for(let i = 0; i < birds.length; i++)
    {
        birds[i].update(cam.eye, elapsedTime, deltaTime);

    }

    for(let i =0; i < fishies.length; i++)
    {
        fishies[i].update(cam.eye, elapsedTime, deltaTime);
    }
    console.log("size " + birds.length)

    //alpha += deltaTime * 2;



    requestAnimationFrame(animate);
    //draw
    drawStuff();
}


function main()
{
    //init globals
    initializeGlobals()

    //begin animation loop
    animate()

}

export {main}
