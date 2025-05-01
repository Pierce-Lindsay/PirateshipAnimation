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

let parsed = false;

//delta time globals
let lastTime = 0;

let splines = []

const CUBE_VERTS = createCube()[0];

const RED = vec4(0.9, 0.1, 0.1, 1.0);
const ORIGIN = vec3(0, 0, 0)
const NORMAL_SCALE = vec3(1, 1,1);

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
        //change spline type after finishing a  rotation


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
