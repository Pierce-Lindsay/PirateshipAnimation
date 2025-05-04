//to avoid cross origin error, must be used with web server, you can use webstorm

import {Renderable, initRenderer, setCam, setProj} from './modules/Renderable.js';
import {Camera, Projection, Transform} from './modules/Transformer.js';
import {createCube, Spline, convertFromEulertoQuanterion, slerp, square, NORMAL_SQUARE} from './modules/Shape.js';
import {Obj, objects, deleteObject} from "./modules/Object.js"
import {Bone, Skeleton} from './modules/Skeleton.js';
import {cleanUpObjects,  createCharacterFeature, Bird, fishies, birds, BoundingSphere, obstacles, spawnFlock, Wing, spawnFish} from "./modules/Animals.js";

//globals

let canvas;
let gl;

//delta time globals
let lastTime = 0;

let twoSecTimer = 0;
let elapsedTime = 0;
let cloudTimer = 0;
let cam = null;
let projection = null;

const CUBE_VERTS = createCube()[0];

const RED = vec4(0.9, 0.1, 0.1, 1.0);
const ORIGIN = vec3(0, 0, 0)
const NORMAL_SCALE = vec3(1, 1,1);
const CAM_SPEED = 0.23;

const FOV = 90;
const NEAR = 0.1;
const FAR = 10
const ASPECT = 1.0;
//returns bool, just takes in the pos

let sun = null;
let testShip = null;

let sea = null;

function moveCamAndNonAffectedObjects(deltaTime)
{
    let mov = vec3(CAM_SPEED * deltaTime, 0, 0);
    testShip.trans.move(mov)
    sea.trans.move(mov)
    sun.trans.move(mov)
    cam.move(mov)
}

function genCloud(camPos, proj, beforeStart = false)
{

    let orgColor = vec4(0.8, 0.8, 0.8, 0.4);
    let z = -6;
    let y = 4;

    y = genUniformRand(-0.75, 0.75) + y;


    let r = genUniformRand(-3, 3);
    let x = camPos[0] + r;

    if(!beforeStart)
       x = camPos[0] + proj.getFrustrumSize(6)[0]/2 + 6 + r;

    let pos = vec3(x, y, z);
    let origin  = createCharacterFeature(null, orgColor, square(structuredClone(NORMAL_SQUARE)), pos, scale(1, NORMAL_SCALE), 0, vec3(0, 0, 1));

    for(let i =0; i < 6; i++)
    {
        createCharacterFeature(origin, orgColor, square(structuredClone(NORMAL_SQUARE)), vec3(genUniformRand(-2, 2), genUniformRand(-1, 1), 0 ), scale(genUniformRand(0.75, 2.5), NORMAL_SCALE), 0, vec3(0, 0, 1));
    }
    objects.push(origin)
}


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

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.BLEND);

    //make the shapes and renderables we need





    sun = createCharacterFeature(null, vec4(1, 0.8, 0.1 ,1), structuredClone(CUBE_VERTS), vec3(0, 5, -8), scale(2, NORMAL_SCALE), 45, vec3(0, 0, 1));
    objects.push(sun)
    //just to prove everything is working(not important at all)
    testShip = createCharacterFeature(null, RED, structuredClone(CUBE_VERTS), vec3(0, 1, 0), scale(1, NORMAL_SCALE), 0, vec3(0, 0, 1));
    let bound = new BoundingSphere(testShip);



    sea = createCharacterFeature(null, vec4(0, 0.2, 0.8, 1), structuredClone(CUBE_VERTS), vec3(0, 0.95, 0), vec3(50, 0.05, 50), 0, vec3(0, 0, 1));
        objects.push(sea)

    objects.push(testShip);

        genCloud(add(cam.eye,vec3 ( 1, 0, 0)), projection, true)
    genCloud(add(cam.eye,vec3(8, 0, 0)), projection, true)

}


//clears background with clear color and then renders if our renderer is active and has things to draw
function drawStuff()
{
    // Set clear color
    gl.clearColor(0.3, 0.3, 0.7, 1.0);

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
    cloudTimer += deltaTime;

    if(twoSecTimer > 6)
    {
        spawnFlock(projection, cam.eye)
        spawnFish(projection, cam.eye);
        twoSecTimer = 0;
    }

    if(cloudTimer > 33)
    {genCloud(cam.eye, projection)
    cloudTimer = 0;}


   // w1.animate(elapsedTime)


    for(let i = 0; i < birds.length; i++)
    {
        birds[i].update(cam.eye, elapsedTime, deltaTime);

    }

    for(let i =0; i < fishies.length; i++)
    {
        fishies[i].update(cam.eye, elapsedTime, deltaTime);
    }

    //alpha += deltaTime * 2;

    moveCamAndNonAffectedObjects(deltaTime)

    requestAnimationFrame(animate);
    //draw
    drawStuff();

   cleanUpObjects(cam.eye);
}


function main()
{
    //init globals
    initializeGlobals()

    //begin animation loop
    animate()

}

export {main}
