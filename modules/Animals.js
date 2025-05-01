
//hard coded wing values that look pretty

import {createCube} from "./Shape.js";
import {Renderable} from "./Renderable.js";
import {Transform} from "./Transformer.js";
import {Obj} from "./Object.js";
import {Skeleton} from "./Skeleton.js";

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



/*

//class for handling our wings, we have two of them so it makes sense to have a class
class Wing
{
    //account for animation time and which wing we're using
    constructor(parent, pos, rotationCounterClockWise, timeForAnimation)
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
        let cubes = [new Obj(cubeR, cubeBase, character), new Obj(cubeR, cubeTrans, character),
            new Obj(cubeR, cubeTrans2, character), new Obj(cubeR, cubeTrans3, character), new Obj(cubeR, cubeTrans4, character)];


        for(let i =0; i < cubes.length; i++) {
            objects.push(cubes[i])
            character.addChild(cubes[i]);
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


*/





//creates feature for a current object or for nothing if parent is given as null, returns new child object
function createCharacterFeature(parent, color, vertices, pos, scale, rotation, rotAxis)
{

    let r = new Renderable(vertices, color)
    let t = new Transform(pos,scale, rotation, rotAxis);
    let feature = new Obj(r, t, parent);
    if(parent != null)
        parent.addChild(feature);
    
    return feature;
}

export {createCharacterFeature}