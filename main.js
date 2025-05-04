//to avoid cross origin error, must be used with web server, you can use webstorm

import {Renderable, initRenderer} from './modules/Renderable.js';
import {setProjection, setCamera, projMatrix, cameraMatrix, Transform} from './modules/Transformer.js';
import {createBall, createCylinder, createCube, Spline, convertFromEulertoQuanterion, slerp} from './modules/Shape.js';
import {Obj, objects, deleteObject} from "./modules/Object.js"
import {Bone, Skeleton} from './modules/Skeleton.js';
import {createCharacterFeature} from "./modules/Animals.js";

//globals

let canvas;
let gl;

//delta time globals
let lastTime = 0;

const CUBE_VERTS = createCube()[0];
const CYCLINDER_VERTS = createCylinder()[0];
const INVERSE_CYLINDER = createCylinder()[1];
const SPHERE_VERTS = createBall();

const RED = vec4(0.9, 0.1, 0.1, 1.0);
const ORIGIN = vec3(0, 0, 0)
const NORMAL_SCALE = vec3(1, 1,1);

let ship = null;
let cannon = null;

let cannonball = null;
let ballVel = vec3();
let ballLaunched = false;

let angle = 0.0;
let pitch = 45.0;

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

    document.getElementById("angleSlider").addEventListener("input", e => angle = parseFloat(e.target.value));
    document.getElementById("pitchSlider").addEventListener("input", e => pitch = parseFloat(e.target.value));

    canvas.addEventListener("click", () => {
        if (!ballLaunched) {
            let rad = (90 - pitch) * Math.PI / 180;
            let rot = angle * Math.PI / 180;
	    /* FIX ME */
            /* Define initial ballPos and ballVel */

            ballVel = vec3(mult(mult(rotateZ(-pitch), rotateX(angle)), vec4(0.0, 1.0, 0.0, 1.0)))

            cannonball.trans.setPos(add(ballVel, cannon.trans.pos));

            ballLaunched = true;
        }
    });

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
    createPirateShip();
    createSail();
}


function createPirateShip() {

    let shipR = new Renderable(CUBE_VERTS, vec4(0.0, 0.0, 0.0, 1.0));
    let shipT = new Transform(vec3(0.0,-1.0,-2.0), vec3(0.5,0.5,0.5), 0.0);

    ship = new Obj(shipR, shipT);

    let bodyR = new Renderable(CUBE_VERTS, vec4(112/256, 60/256, 37/256, 1.0));
    let bodyT = new Transform(ORIGIN, vec3(3.0, 1.5, 1.5), 0.0);

    ship.addChild(new Obj(bodyR, bodyT, ship));

    let mastR = new Renderable(CUBE_VERTS, vec4(112/256, 60/256, 37/256, 1.0));
    let mastT = new Transform(vec3(0.0, 2.5, 0.0), vec3(0.5, 4.0, 0.5), 0.0);

    let mastCrossR1 = new Renderable(CUBE_VERTS, vec4(112/256, 60/256, 37/256, 1.0));
    let mastCrossR2 = new Renderable(CUBE_VERTS, vec4(112/256, 60/256, 37/256, 1.0));

    let mastCrossT1 = new Transform(vec3(0.25, 1.8, 0.0), vec3(0.25, 0.25, 2.5), 0.0);
    let mastCrossT2 = new Transform(vec3(0.25, 4.2, 0.0), vec3(0.25, 0.25, 2.5), 0.0);

    ship.addChild(new Obj(mastR, mastT, ship));
    ship.addChild(new Obj(mastCrossR1, mastCrossT1, ship));
    ship.addChild(new Obj(mastCrossR2, mastCrossT2, ship));

    let bowspritR = new Renderable(CUBE_VERTS, vec4(112/256, 60/256, 37/256, 1.0));
    let bowspritT = new Transform(vec3(2.0, 0.5, 0.0), vec3(1.5, 0.5, 0.5), 0.0);
    bowspritT.rotate(10);

    ship.addChild(new Obj(bowspritR, bowspritT, ship));

    let cannonR = new Renderable(CYCLINDER_VERTS, vec4(0.4, 0.4, 0.4, 1.0));
    let cannonT = new Transform(vec3(1.0, 0.8, 0.0), vec3(0.3, 1.5, 0.3), 0.0);

    cannon = new Obj(cannonR, cannonT, ship);

    let inverseR = new Renderable(INVERSE_CYLINDER, vec4(0.2, 0.2, 0.2, 1.0));
    let inverseT = new Transform(ORIGIN, vec3(1.0, 1.0, 1.0), 0.0);

    cannon.addChild(new Obj(inverseR, inverseT, cannon));

    ship.addChild(cannon);

    let ballR = new Renderable(SPHERE_VERTS, vec4(0.4, 0.4, 0.4, 1.0));
    let ballT = new Transform(ORIGIN, vec3(5, 5, 5), 0.0);

    cannonball = new Obj(ballR, ballT, ship);

    ship.addChild(cannonball);

    objects.push(ship);
}

function createSail() {
    let sailR = new Renderable(CUBE_VERTS, vec4(1.0, 1.0, 1.0, 1.0));
    let sailT = new Transform(vec3(0.35, 3.0, 0.0), vec3(0.1, 2.25, 2.25), 0.0);

    ship.addChild(new Obj(sailR, sailT, ship));
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

let theta = 0.0;

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

    theta += 0.01;

    let r1 = rotateX(Math.sin(theta) * 5);
    let r2 = rotateZ(Math.sin(theta) * 5);

    ship.trans.setRotMat(mult(r1, r2));
    ship.trans.move(vec3(0.0, Math.cos(theta-2.0)/500, 0.0));

    cannon.trans.setRotMat(mult(rotateZ(-pitch), rotateX(angle)));

    if (ballLaunched) {
        cannonball.trans.move(scale(deltaTime * 10, ballVel));
        ballVel[1] -= 1.5 * deltaTime;

        if (cannonball.trans.pos[1] < -5) {
            ballLaunched = false;
            cannonball.trans.setPos(ORIGIN);
        }
    }

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
