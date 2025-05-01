//to avoid cross origin error, must be used with web server, you can use webstorm

import {Renderable, initRenderer} from './modules/Renderable.js';
import {setProjection, setCamera, projMatrix, cameraMatrix, Transform} from './modules/Transformer.js';
import {createCube, Spline, convertFromEulertoQuanterion, slerp} from './modules/Shape.js';
import {Obj, objects, deleteObject} from "./modules/Object.js"
import {Bone, Skeleton} from './modules/Skeleton.js';
import {createCharacterFeature} from "./modules/Animals.js";

//globals

let canvas;
let gl;

//delta time globals
let lastTime = 0;

const CUBE_VERTS = createCube()[0];

const RED = vec4(0.9, 0.1, 0.1, 1.0);
const ORIGIN = vec3(0, 0, 0)
const NORMAL_SCALE = vec3(1, 1,1);


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

    //init renderer
    initRenderer(gl)
    //default normal, basically does nothing
    setProjection(perspective(90, 1.0, 0.25, 20.0))
    //default look at middle of screen
    setCamera(lookAt(vec3(0, 0, 2), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) ))
    //init default viewports and gl stuff
    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.cullFace(gl.BACK)
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST);

    //make the shapes and renderables we need


    //just to prove everything is working(not important at all)
    objects.push(createCharacterFeature(null, RED, structuredClone(CUBE_VERTS), ORIGIN, scale(0.5, NORMAL_SCALE), 0, vec3(0, 0, 1)))
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

   // splineTime += deltaTime;


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
