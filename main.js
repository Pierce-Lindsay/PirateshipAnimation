//to avoid cross origin error, must be used with web server, you can use webstorm

import {Renderable, initRenderer} from './modules/Renderable.js';
import {setProjection, setCamera, projMatrix, cameraMatrix, Transform} from './modules/Transformer.js';
import {createCube, Spline, convertFromEulertoQuanterion, slerp} from './modules/Shape.js';
import {Obj} from "./modules/Object.js"
import {Bone, Skeleton} from './modules/Skeleton.js';
//globals

let canvas;
let gl;

let parsed = false;
let cubeBoy = null;
let wingR = null;
let wingL = null;
let objects = [];
let drawObjects = false;

let alpha = 0;

//delta time globals
let splineTime = 0.0;
let lastTime = 0;

let splines = []


//hard coded wing values that look pretty

let WING_ROTATIONS =[
    [0, 0, 0, 0, 0],
    [20, 30, 50, 60, 80],
    [30, 40, 60, 80, 100],
    [-20, -30, -50, -60, -80],
    [-30, -40, -60, -80, -100],
    [-20, -30, -50, -60, -80],
    [0, 0, 0, 0, 0]];

const WING_SEG1_SCALE = vec3(0.35, 0.25, 0.25)
const WING_SEG2_SCALE = vec3(0.85, 0.2, 0.4)
const WING_SEG3_SCALE = vec3(1.1, 0.15, 0.4)
const WING_SEG4_SCALE = vec3(0.85, 0.1, 0.3)
const WING_SEG5_SCALE = vec3(0.35, 0.1, 0.25)

const WING_L1 = 0.25;
const WING_L2 = 0.75;
const WING_L3 = 1;
const WING_L4 = 0.75;
const WING_L5 = 0.25;

const WING_DEF = vec3(0, 0, 1);


/**
 * Sets up a FileReader object to read an uploaded file as a text file.
 *
 * @param evt The fired event that contains the uploaded file.
 * @returns {FileReader} The FileReader object for the uploaded file.
 */
function readTextFile(evt)
{
    let file = evt.target.files[0];

    let reader = new FileReader();
    reader.readAsText(file);
    return reader;
}


//parses a string of vec3 floats into a vec3 of floats
function parseVec3(str)
{
    //in format float, float, float
    let floats = [];
    let currentStrFloat = "";
    for(let i =0; i< str.length; i++)
    {
        if(str.charAt(i) === ",")
        {
            floats.push(currentStrFloat)
            currentStrFloat = "";
        }

        if(str.charAt(i) !== "," && str.charAt(i) !== '\n' && str.charAt(i) !== " ")
            currentStrFloat = currentStrFloat.concat(str.charAt(i));

        if(i + 1 === str.length)
            floats.push(currentStrFloat)
    }

    return vec3(parseFloat(floats[0]), parseFloat(floats[1]), parseFloat(floats[2]));
}


//parses all teh spline data from file
function parseSplines(reader) {
    console.log("parsing");
    let fileString = reader.result;

    //ignore commented lines with "#"
    let ignore = false;
    let lines = [];
    let currentLine = "";
    for (let i = 0; i < fileString.length; i++) {
        if (fileString.charAt(i) === '#')
            ignore = true;

        if (!ignore && (fileString.charAt(i) !== '\n' && fileString.charAt(i) !== '\r'))
            currentLine = currentLine.concat(fileString.charAt(i));

        if (fileString.charAt(i) === '\n' || fileString.charAt(i) === '\r') {
            ignore = false;
            if (currentLine !== "")
                lines.push(currentLine);
            currentLine = "";
        }

    }

    //get number of splines
    let numberOfSplines = parseInt(lines[0]);
    let currSpot = 1;
    //for each spline, keep track of position in data
    for (let i = 0; i < numberOfSplines; i++) {
        let numberOfPoints = parseInt(lines[currSpot]);
        currSpot += 1;
        let time = parseFloat(lines[currSpot])
        currSpot += 1;

        let points = [];
        let axis = [];

        //now go through points

        //push points into translation and rotation arrays
        for (let j = 0; j < numberOfPoints; j++) {
            points.push(parseVec3(lines[currSpot]))
            currSpot += 1;
            axis.push(parseVec3(lines[currSpot]))
            currSpot += 1;

        }

        //push new spline
        let s = new Spline(time, points, axis);
        console.log(s)

        splines.push(s);
    }
    parsed = true;
}


//class for handling our wings, we have two of them so it makes sense to have a class
class Wing
{
    //account for animation time and which wing we're using
    constructor(right, timeForAnimation)
    {
        this.timeForAnimation = timeForAnimation;

        //need to flip everything for left wing
        this.right = right;
        this.dir = 1;
        if(!right)
            this.dir *= -1;


        let sCube = createCube();

        let cubeR = new Renderable(sCube[0], vec4(0.9, 0.55, 0.6, 1.0))
        //base joint position, doesnt really matter
        let filler = vec3(0, 0, 0);

        //setup our square that will be transformed by bones
        let cubeBase = new Transform(vec3(0.5 * this.dir, 0, 0), WING_SEG1_SCALE, 0.0)
        let cubeTrans = new Transform(filler,WING_SEG2_SCALE , 0.0);
        let cubeTrans2 = new Transform(filler, WING_SEG3_SCALE, 0.0);
        let cubeTrans3 = new Transform(filler, WING_SEG4_SCALE, 0.0);
        let cubeTrans4 = new Transform(filler, WING_SEG5_SCALE, 0.0);

        //create objects
        let cubes = [new Obj(cubeR, cubeBase, cubeBoy), new Obj(cubeR, cubeTrans, cubeBoy),
            new Obj(cubeR, cubeTrans2, cubeBoy), new Obj(cubeR, cubeTrans3, cubeBoy), new Obj(cubeR, cubeTrans4, cubeBoy)];


        for(let i =0; i < cubes.length; i++) {
            objects.push(cubes[i])
            cubeBoy.addChild(cubes[i]);
        }

        //data for skeleton

        let lengths = [WING_L1, WING_L2, WING_L3, WING_L4, WING_L5];
        let axis = [WING_DEF,WING_DEF,WING_DEF,WING_DEF,WING_DEF]

        //create skeleton with our objects attached to corresponding bones
        this.skeleton = new Skeleton(vec3(0, 0, 0), lengths, axis, cubes);


    }

    //interpolate between two rotations of skeleton
    handleAnimationInterpolate(rSetI, rSetF, t)
    {
       let mixed =  mix(rSetI, rSetF, t);
       this.skeleton.animateSkeleton(mixed);
    }

    //animate the wing
    animate(t)
    {
        //setup buckets to be spaced evenly by amount of slots in array and animation time
        let buckets = WING_ROTATIONS.length-1
        t*= buckets/ this.timeForAnimation;

        let floorT =Math.floor(t);
        //find what bucket we fall in
        let bucketPos = (floorT % buckets);
        //fractional of 1
        let bucketT = (t - floorT);


        //setup left wing rotation differences if neccessary
        let customRots = structuredClone(WING_ROTATIONS);
        if(!this.right)
        {
            for(let i = 0; i < customRots.length; i++)
            {
                customRots[i] = scale(this.dir, customRots[i]);
                //180 degrees to flip
                customRots[i] = add(customRots[i], [180, 180, 180, 180, 180]);
            }
        }
        //linearly interpolate between wing positions
        this.handleAnimationInterpolate(customRots[bucketPos], customRots[bucketPos+1], bucketT);
    }
}


//creates our character to be animated
function createCharacter()
{

    //a whole bunch of code to add details to cube character
    let sCube = createCube();

    //body

    let cubeR = new Renderable(sCube[0], vec4(1, 0.6, 0.7, 1.0))
    let cubeTrans = new Transform(vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), 0.0);
    cubeBoy = new Obj(cubeR, cubeTrans);

    //eyes

    let eye1R = new Renderable(sCube[0], vec4(1.0, 1.0, 0.0, 1.0));
    let eye2R = new Renderable(sCube[0], vec4(1.0, 1.0, 0.0, 1.0));

    let eye1Trans = new Transform(vec3(-0.4, 0.0, 0.4), vec3(0.25, 0.25, 0.25), 0.0);
    let eye2Trans = new Transform(vec3(0.4, 0.0, 0.4), vec3(0.25, 0.25, 0.25), 0.0);

    cubeBoy.addChild(new Obj(eye1R, eye1Trans, cubeBoy));
    cubeBoy.addChild(new Obj(eye2R, eye2Trans, cubeBoy));

    //ears

    let ear1R = new Renderable(sCube[0], vec4(1.0, 0.3, 0.0, 1.0));
    let ear2R = new Renderable(sCube[0], vec4(1.0, 0.3, 0.0, 1.0));

    let ear1Trans = new Transform(vec3(-0.2, 0.4, 0), vec3(0.2, 0.7, 0.2), 0);
    let ear2Trans = new Transform(vec3(0.2, 0.4, 0), vec3(0.2, 0.7, 0.2), 0);

    //feet
    let feet1R = new Renderable(sCube[0], vec4(1, 0.4, 0.5, 1.0));
    let feet2R = new Renderable(sCube[0], vec4(1, 0.4, 0.5, 1.0));

    let feet1Trans = new Transform(vec3(-0.25, -0.55, 0), vec3(0.33, 0.33, 0.33), 0);
    let feet2Trans = new Transform(vec3(0.25, -0.55, 0), vec3(0.33, 0.33, 0.33), 0);


    cubeBoy.addChild(new Obj(ear1R, ear1Trans, cubeBoy));
    cubeBoy.addChild(new Obj(ear2R, ear2Trans, cubeBoy));

    cubeBoy.addChild(new Obj(feet1R, feet1Trans, cubeBoy));
    cubeBoy.addChild(new Obj(feet2R, feet2Trans, cubeBoy));


    objects.push(cubeBoy)
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

    //init renderer
    initRenderer(gl)
    //default normal, basically does nothing
    setProjection(perspective(90, 1.0, 0.25, 20.0))
    //default look at middle of screen
    setCamera(lookAt(vec3(0.75, -1, 8), vec3(0.0, 2.0, 0.0), vec3(0.0, 1.0, 0.0) ))
    //init default viewports and gl stuff
    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.cullFace(gl.BACK)
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST);

    //make the shapes and renderables we need

    createCharacter()


    //create referance objects
    let sCube = createCube();
    let floorR = new Renderable(sCube[0], vec4(0.3, 0.8, 0.2, 1.0));
    let floorTrans = new Transform(vec3(0.0, -3, 3.0), vec3(20.0, 1.0, 20.0), 0.0);

    let boxR = new Renderable(sCube[0], vec4(0.8, 0.0, 0.8, 1.0));
    let boxTrans = new Transform(vec3(3.75, -1, 3.0), vec3(2.0, 5.0, 2.0), 0.0);

    boxTrans.setRotAxis(vec3(0, 1, 0))
    boxTrans.rotate(45)

    objects.push(new Obj(floorR, floorTrans));
    objects.push(new Obj(boxR, boxTrans));
}


//clears background with clear color and then renders if our renderer is active and has things to draw
function drawStuff()
{
    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas> by clearning the color buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //draw
    if(drawObjects)
    {
        for(let i =0; i < objects.length; i++)
        {
            objects[i].drawAll();
        }
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

    splineTime += deltaTime;
        //change spline type after finishing a  rotation


if(parsed && splines.length >= 1) {

    //if wings are null, define them
    if(wingR == null)
    {
        wingR = new Wing(true, splines[0].time);
        wingL = new Wing(false, splines[0].time);
    }

    drawObjects = true;
    //transform cube according to spline
    let newPos = splines[0].getPosition(splineTime, false);
    cubeBoy.trans.setPos(vec3(newPos[0], newPos[1], newPos[2]));
    cubeBoy.trans.setRotMat(splines[0].getRotation(splineTime))

    //animate wings
    wingR.animate(splineTime);
    wingL.animate(splineTime);

    alpha += 0.01;
    cubeBoy.trans.move(vec3(0, 0, alpha))
}

    requestAnimationFrame(animate);
    //draw
    drawStuff();
}


function main()
{

    //check for file upload
    document.getElementById('fileupload').addEventListener('change',function(){
        let reader = readTextFile(event)
        //when file loads, read it in to our SVG
        reader.onload = function() {
            console.log('loaded file');
            parseSplines(reader)
        }
    }, false);
    //init globals
    initializeGlobals()

    //begin animation loop
    animate()

}

export {main}
