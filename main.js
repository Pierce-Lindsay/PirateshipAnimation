//to avoid cross origin error, must be used with web server, you can use webstorm

import {Renderable, initRenderer, setCam, setProj} from './modules/Renderable.js';
import {Camera, Projection, Transform} from './modules/Transformer.js';
import {createPrism, createBall, createCylinder, createCube, Spline, convertFromEulertoQuanterion, slerp, NORMAL_SQUARE, square} from './modules/Shape.js';
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
const CYCLINDER_VERTS = createCylinder()[0];
const INVERSE_CYLINDER = createCylinder()[1];
const SPHERE_VERTS = createBall();
const PRISM_VERTS = createPrism();

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

let sea = null;

function moveCamAndNonAffectedObjects(deltaTime)
{
    let mov = vec3(CAM_SPEED * deltaTime, 0, 0);
    ship.trans.move(mov)
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


let ship = null;
let cannon = null;

let sail = null;
let sailShader;

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

    cam = new Camera(vec3(0, 2, 2), vec3(0, 2, 0), vec3(0, 1, 0))
    projection = new Projection(FOV, ASPECT, NEAR, FAR)

    //init renderer
    initRenderer(gl, cam, projection)
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

    sailShader = initShaders(gl, "sailshader", "fshader");

    //default normal, basically does nothing
    //init default viewports and gl stuff
    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.cullFace(gl.BACK)
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.BLEND);

    //make the shapes and renderables we need
    createPirateShip();
}


function createPirateShip() {

    let shipR = new Renderable(CUBE_VERTS, vec4(0.0, 0.0, 0.0, 1.0));
    let shipT = new Transform(vec3(0.0,0.9,-1.0), vec3(0.5,0.5,0.5), 0.0);

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

    let sailR1 = new Renderable(PRISM_VERTS, vec4(1.0, 1.0, 1.0, 1.0), sailShader);
    let sailT1 = new Transform(vec3(0.35, 1.8, 0.0), vec3(0.1, 0.3, 2.25), 0.0);

    let sail = new Obj(sailR1, sailT1, ship);

    ship.addChild(sail);

    let bowspritR = new Renderable(CUBE_VERTS, vec4(112/256, 60/256, 37/256, 1.0));
    let bowspritT = new Transform(vec3(2.0, 0.5, 0.0), vec3(1.5, 0.5, 0.5), 0.0);
    bowspritT.rotate(10);

    ship.addChild(new Obj(bowspritR, bowspritT, ship));

    sun = createCharacterFeature(null, vec4(1, 0.8, 0.1 ,1), structuredClone(CUBE_VERTS), vec3(0, 5, -8), scale(2, NORMAL_SCALE), 45, vec3(0, 0, 1));
    objects.push(sun)
    //just to prove everything is working(not important at all)

    let bound = new BoundingSphere(ship, vec3(0, 0.5, 0), 2);



    sea = createCharacterFeature(null, vec4(0, 0.2, 0.8, 1), structuredClone(CUBE_VERTS), vec3(0, 0.95, 0), vec3(50, 0.05, 50), 0, vec3(0, 0, 1));
        objects.push(sea)


        genCloud(add(cam.eye,vec3 ( 1, 0, 0)), projection, true)
    genCloud(add(cam.eye,vec3(8, 0, 0)), projection, true)

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
    console.log(ship)
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

    moveCamAndNonAffectedObjects(deltaTime)


    //Animate boat rocking
    theta += 0.01;

    let r1 = rotateX(Math.sin(theta) * 5);
    let r2 = rotateZ(Math.sin(theta) * 5);

    ship.trans.setRotMat(mult(mult(r1, r2), rotateY(0)));
    ship.trans.move(vec3(0.0, Math.cos(theta-2.0)/700, 0.0));

    //Set cannon position
    cannon.trans.setRotMat(mult(rotateZ(-pitch), rotateX(angle)));

    //Animate cannonball
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
