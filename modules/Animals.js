
//hard coded wing values that look pretty

import {createCube} from "./Shape.js";
import {Renderable} from "./Renderable.js";
import {Transform, Projection} from "./Transformer.js";
import {Obj, objects, deleteObject} from "./Object.js";
import {Skeleton} from "./Skeleton.js";

let WING_ROTATIONS =[
    [0, 0, 0, 0, 0],
    [20, 30, 50, 60, 80],
    [30, 40, 60, 80, 100],
    [-20, -30, -50, -60, -80],
    [-30, -40, -60, -80, -100],
    [-20, -30, -50, -60, -80],
    [0, 0, 0, 0, 0]];

const WING_SEG1_SCALE = vec3(0.6, 0.25, 0.4)
const WING_SEG2_SCALE = vec3(1.1, 0.2, 0.6)
const WING_SEG3_SCALE = vec3(1.3, 0.15, 0.6)
const WING_SEG4_SCALE = vec3(1.1, 0.1, 0.5)
const WING_SEG5_SCALE = vec3(0.6, 0.1, 0.4)

const WING_L1 = 0.25;
const WING_L2 = 0.75;
const WING_L3 = 1;
const WING_L4 = 0.75;
const WING_L5 = 0.25;

const WING_DEF = vec3(0, 0, 1);





//class for handling our wings, we have two of them so it makes sense to have a class
class Wing
{
    //account for animation time and which wing we're using
    constructor(parent, pos, rotationCounterClockWise, timeForAnimation)
    {
        this.timeForAnimation = timeForAnimation;

        //need to flip everything for left wing
        this.right = rotationCounterClockWise;
        this.dir = 1;
        if(!rotationCounterClockWise)
            this.dir *= -1;


        let sCube = createCube();

        let cubeR = new Renderable(sCube[0], vec4(0.3, 0.3, 0.4, 1.0))
        //base joint position, doesnt really matter
        let filler = vec3(0, 0, 0);

        //setup our square that will be transformed by bones
        let cubeBase = new Transform(vec3(0.5 * this.dir, 0, 0), WING_SEG1_SCALE, 0.0)
        let cubeTrans = new Transform(filler,WING_SEG2_SCALE , 0.0);
        let cubeTrans2 = new Transform(filler, WING_SEG3_SCALE, 0.0);
        let cubeTrans3 = new Transform(filler, WING_SEG4_SCALE, 0.0);
        let cubeTrans4 = new Transform(filler, WING_SEG5_SCALE, 0.0);

        //create objects
        let cubes = [new Obj(cubeR, cubeBase, parent), new Obj(cubeR, cubeTrans, parent),
            new Obj(cubeR, cubeTrans2, parent), new Obj(cubeR, cubeTrans3, parent), new Obj(cubeR, cubeTrans4, parent)];


        for(let i =0; i < cubes.length; i++) {
            objects.push(cubes[i])
            parent.addChild(cubes[i]);
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




//constants that i messed with until particles played nice
const OBSTACLE_FORCE = 0.025;
const COHESION_FORCE = 0.01;
const ALIGNMENT_FORCE = 0.005;
const SEPERATION_FORCE = 0.01;

//besides y level, relative to camera
//consstraints for particles, if they are outside these bounds, they despawn
const WATER_LEVEL = 1;
const Y_MAX = 15;
const X_MIN = -15;
const X_MAX = 15;
const Z_MIN = -15;
const Z_MAX = 20;


//visionconstants
const VISION = 0.4

//constant for particle seperation
const TOO_CLOSE_RAD = 0.2;


let birds = [];
let obstacles = [];

//deletes a particle from the array and corresponsing object
function deleteBird(id) {
    let newBirds = [];
    for(let i= 0; i < birds.length; ++i)
    {
        if(birds[i].obj.id !== id)
            newBirds.push(birds[i]);
    }
    birds= newBirds;
    deleteObject(id);
}


//parent class for particles and handling them
class Bird {

//constructor
    constructor (posInitial, velocityInitial, color, uniformSizeFactor)
    {
        this.pos = structuredClone(posInitial);
        this.velocity = structuredClone(velocityInitial);
        //default is red vision
        this.vision = VISION
        //radius a lil bigger same as scale factor for simplicity
        this.rad = uniformSizeFactor * 1.2;

        let CUBE_VERTS = createCube()[0];
        let NORMAL_SCALE = vec3(1,1,1);
        //initialize corresponding things for rendering and hierarchies

        this.obj = createCharacterFeature(null, vec4(0.3, 0.3, 0.3, 1.0), structuredClone(CUBE_VERTS), posInitial, scale(uniformSizeFactor, NORMAL_SCALE), 0, vec3(0, 0, 1));
        let f1 = createCharacterFeature(this.obj, vec4(0.9, 0.9, 0.9, 1.0), structuredClone(CUBE_VERTS), vec3(0, 0, -0.5), scale(0.9, NORMAL_SCALE), 0, vec3(0, 0, 1) )
        let butt = createCharacterFeature(f1, vec4(0.3, 0.3, 0.3, 1.0), structuredClone(CUBE_VERTS), vec3(0, 0.0, -0.5), scale(0.5, NORMAL_SCALE), 0, vec3(0, 0, 1) )
        let f2 = createCharacterFeature(this.obj, vec4(0.9, 0.9, 0.9, 1.0), structuredClone(CUBE_VERTS), vec3(0, 0, 0.5), scale(0.9, NORMAL_SCALE), 0, vec3(0, 0, 1) )
        let f3 = createCharacterFeature(f2, vec4(0.9, 0.9, 0.9, 1.0), structuredClone(CUBE_VERTS), vec3(0, 0.25, 0.5), scale(1.2, NORMAL_SCALE), 0, vec3(0, 0, 1) )
        let e1 = createCharacterFeature(f3, vec4(0, 0, 0.2, 1.0), structuredClone(CUBE_VERTS), vec3(0.2, 0.25, 0.4), scale(0.3, NORMAL_SCALE), 0, vec3(0, 0, 1) )
        let e2 = createCharacterFeature(f3, vec4(0, 0, 0.2, 1.0), structuredClone(CUBE_VERTS), vec3(-0.2, 0.25, 0.4), scale(0.3, NORMAL_SCALE), 0, vec3(0, 0, 1) )
        let b = createCharacterFeature(f3, vec4(0.8, 0.6, 0.1, 1.0), structuredClone(CUBE_VERTS), vec3(0, -0.1, 0.6), vec3(0.3,0.3, 0.4), 0, vec3(0, 0, 1) )

        this.rightWing = new Wing(this.obj, vec3(0, 0, 0), true, 1);
        this.leftWing = new Wing(this.obj, vec3(0, 0, 0), false, 1);

        objects.push(this.obj)

        birds.push(this)
    }


    //function for determing where other is in the vision radius of this particle
    obstacleCanBeSeen(obstacle) {
        let delta = subtract(this.pos, obstacle.getPos())
        if(length(delta) < (obstacle.getRad()+ this.vision))
            return true;
        return false;
    }

    birdCanBeSeen(bird)
    {
        let delta = subtract(this.pos, bird.pos)
        if(length(delta) < (bird.rad + this.vision))
            return true;
        return false;
    }


    //finds influence of a corresponding obstacle on our velocity
    findObstacleInfluence(obstacle)
    {
        //points from obstacle to our object
        if(this.obstacleCanBeSeen(obstacle))
        {
            let delta = subtract(this.pos, obstacle.getPos())
            let forceMag = OBSTACLE_FORCE/(length(delta) - obstacle.getRad());
            return scale(forceMag, normalize(delta));
        }
        else
            return vec3(0, 0, 0);
    }


    //loop through all obstacles and add their impacts
    checkForObstacleAvoidence()
    {
        let obstacleInfluenceDir = vec3(0.0, 0.0, 0.0);
        for(let i= 0; i < obstacles.length; i++)
        {
            obstacleInfluenceDir = add(obstacleInfluenceDir, this.findObstacleInfluence(obstacles[i]));
        }

        //also check water
        //sea level is 1, i will make this more clear later
        if(this.pos[1] - this.vision< 1)
        {
            let delta = vec3(0, this.pos[1] - 1, 0)
            let forceMag = OBSTACLE_FORCE/(length(delta));
            obstacleInfluenceDir = add(obstacleInfluenceDir, scale(forceMag, normalize(delta)));
        }


        this.velocity = scale(length(this.velocity), normalize(add(obstacleInfluenceDir, this.velocity)))
    }




    //calculate average flock velocity of those we can see
    findAverageVelocityOfNearbyMates()
    {
        //for now not going to consider self
        let currentAvg = vec3(0,0, 0)
        for(let i =0; i < birds.length; i++)
        {
            if(this.obj.id !== birds[i].obj.id && this.birdCanBeSeen(birds[i]))
                currentAvg = add(currentAvg, normalize(birds[i].velocity));
        }
        if(length(currentAvg) !== 0)
            return normalize(currentAvg);
        return vec3(0, 0, 0);
    }

    //calculate average flock position of those we can see
    findAveragePositionOfNearbyMates()
    {
        //for now not going to consider self
        let currentAvg = this.pos;
        let divisor = 1;
        for(let i =0; i < birds.length; i++)
        {
            if(this.obj.id !== birds[i].obj.id && this.birdCanBeSeen(birds[i]))
            {
                currentAvg = add(currentAvg, birds[i].pos);
                divisor++;
            }
        }

        //vector towards average position

        let avgPos = scale(1.0/divisor, currentAvg);
        let vectorToPos = (subtract(avgPos, this.pos));

        if(length(vectorToPos) !== 0)
            return normalize(vectorToPos)
        else
            return vec3(0, 0, 0);
    }

    //if the particle(flockmate) is too close, returns a vector pointing in the opposite direction from the neighbor
    //else returns 0 vector
    tooCloseDelta(other)
    {
        let deltaAway = subtract(this.pos, other.pos);

        if(length(deltaAway) <= TOO_CLOSE_RAD)
        {
            return normalize(deltaAway);
        }
        else
            return vec3(0, 0, 0)
    }


    //find all the nearby guys of same type and if they are too close,
    // take that vector away from them into account
    findTooCloseMates()
    {
        //for now not going to consider self
        let currentAvg = vec3(0,0, 0)
        for(let i =0; i < birds.length; i++)
        {
            //shoudl already be normalized
            if(this.obj.id !== birds[i].obj.id && this.birdCanBeSeen(birds[i]))
                currentAvg = add(currentAvg, this.tooCloseDelta(birds[i]));

        }

        if(length(currentAvg) !== 0)
            return normalize(currentAvg);
        return vec3(0, 0, 0);
    }

    //function for handling these specifics of a flock
    cohesionFlockingSeperation()
    {
        //we need to know
        // current average of velocities of all nearby flockmates,
        //current average position of neaby flockmates
        //whether we are too close to any flockmates

        //get average velocity
        let avgVel = this.findAverageVelocityOfNearbyMates()
        let avgPos = this.findAveragePositionOfNearbyMates()

        let avgAwayFromNeighbors = this.findTooCloseMates()

        let newInflu = add(scale(ALIGNMENT_FORCE, avgVel),add(scale(COHESION_FORCE, avgPos), scale(SEPERATION_FORCE, avgAwayFromNeighbors)));

        this.velocity = scale(length(this.velocity), normalize(add(this.velocity, newInflu)));
    }


    //function for rotating the head to be aligned with dir of velocity
    alignHeadWithVelocity()
    {
        //get angle of velocity vector, head is default facing up which means 90 degree ahead, s
        // o vector aiming 90 degrees should be 0(subtract 90)

        //actually doesn't matter whether normal or not
        let rot = -90;
        if(this.velocity[0] === 0)
        {
            //undefined
            if(this.velocity[2] > 0)
                rot = 270;
            else
                rot = 90;
        }
        else
        {
            //get the absolute value and then figure out what quadrant we're in
            let theta = (180 * Math.atan(Math.abs(this.velocity[2]/this.velocity[0])))/Math.PI;

            if(this.velocity[0] > 0 && this.velocity[2] <= 0)
                rot = theta;
            else if(this.velocity[0] < 0 && this.velocity[2] <= 0)
                rot = 180 -theta;
            else if(this.velocity[0] < 0 && this.velocity[2] > 0)
                rot = 180 +theta;
            else if(this.velocity[0] > 0 && this.velocity[2] > 0)
                rot = 360 - theta;

        }


        //subtract by 90 cause default head position is facing up
        this.obj.trans.setRotAxis(vec3(0, 1,0))
        this.obj.trans.setRotate(rot+90);

    }



    checkIfBirdShouldDespawn(camPos)
    {
        return this.pos[0] < camPos[0] + X_MIN ||
            this.pos[0] > camPos[0] + X_MAX ||
            this.pos[1] < WATER_LEVEL||
            this.pos[1] > camPos[1] + Y_MAX ||
            this.pos[2] < camPos[2] + Z_MIN ||
            this.pos[2] > camPos[2] + Z_MAX;
    }

    updateParticalDespawn(camPos)
    {
        if(this.checkIfBirdShouldDespawn(camPos))
        {
            deleteBird(this.obj.id)
            return true;
        }
        return false;
    }




    //update function for a particle, calls all the important aspects which all individually impact final velocity
    //speed remains constant!, only direction changes
    update(camPos, t, deltaTime)
    {
        //wall avoidence

        if(!this.updateParticalDespawn(camPos))
        {
            this.cohesionFlockingSeperation()
            this.checkForObstacleAvoidence()
            this.obj.trans.move(scale(deltaTime, this.velocity))
            this.pos = add(this.pos, scale(deltaTime, this.velocity))


            this.leftWing.animate(t)
            this.rightWing.animate(t)
            this.alignHeadWithVelocity()
        }
    }


}



//class for an obstructions, has  a position and radius so particles know how to interact with them(this is seperate from a renderable!) its basically a
//bound sphere
class BoundingSphere {
    //parent might be the object this bounding sphere is around (note if parent isn't null, inputed perameters are from parent's local space
    constructor(parent, posOffsetFromParent = vec3(0, 0, 0), radiusMultiplierFromParent = 1)
    {
        this.posOffsetFromParent = posOffsetFromParent;
        this.radiusMultiplierFromParent = radiusMultiplierFromParent;
        //acts like pointer
        if(parent!= null)
            this.trans = parent.trans;
        else
            this.trans = new Transform(posOffsetFromParent, vec3(radiusMultiplierFromParent,radiusMultiplierFromParent, radiusMultiplierFromParent), 0);

        obstacles.push(this);

    }

    getPos()
    {
        if(parent!= null)
            return add(this.trans.pos, this.posOffsetFromParent)
        return this.posOffsetFromParent;
    }

    //note!! assumes uniform object!!!!
    getRad()
    {
        if(parent!= null)
            return this.trans.scale[0] * this.radiusMultiplierFromParent
        return this.radiusMultiplierFromParent;
    }

}





function genUniformRand(min, max)
{
    let size = max - min;
    let offset = min;
    return  (Math.random() * size) + min
}

function genRandPointOutsideFrustrum(proj, camPos)
{
    //gen z first
    //first decide whether z is behind or in front
    let z = 0;
    let behind = false;
    if(Math.random() > 0.5)
    {
        z = genUniformRand(-proj.far + camPos[2], Z_MIN );
    }
    else
    {
        z = genUniformRand(-proj.near + + camPos[2], Z_MAX );
        behind = true;
    }

    //now that we know z, we can solve for correct frustrum bounds of x and y

    let x = 0;
    let y = 0;

    if(behind)
    {
        x = genUniformRand(X_MIN, X_MAX);
        y = genUniformRand(WATER_LEVEL, Y_MAX);
    }
    else {
        let halfFrustSize = proj.getFrustrumSize(proj.far)[0]/2.0;
        let maxXFrustrumBound = + camPos[0]+ halfFrustSize;
        let minXFrustrumBound = + camPos[0] - halfFrustSize;

        let maxYFrustrumBound = + camPos[1]+ halfFrustSize;


        if (Math.random() > 0.5) {
            x = genUniformRand(maxXFrustrumBound, X_MAX);
        } else
            x = genUniformRand(X_MIN, minXFrustrumBound);

        y = genUniformRand(maxYFrustrumBound, Y_MAX);

    }
    return vec3(x, y, z);
}




function genRandPointInsideFrustrum(proj, camPos)
{

    //now that we know z, we can solve for correct frustrum bounds of x and y

    let halfFrustSize = proj.getFrustrumSize(proj.near * 3)[0]/2.0;
    let maxXFrustrumBound = + camPos[0] + halfFrustSize;
    let minXFrustrumBound = + camPos[0] - halfFrustSize;

    let maxYFrustrumBound = + camPos[1] + halfFrustSize;

    let x = genUniformRand( minXFrustrumBound, maxXFrustrumBound);
    let y = genUniformRand(WATER_LEVEL, maxYFrustrumBound);
    let z = genUniformRand(-proj.near + + camPos[2], -(proj.far/3.0) + camPos[2]);

    // console.log(vec3(x, y, z))
    return vec3(x, y, z);
}

function spawnFlock(proj, camPos)
{
    if(birds.length > 20)
        return;
    //generateRandom num between 1 and 7

    let size = Math.ceil(genUniformRand(1, 7))

   let pos = genRandPointOutsideFrustrum (proj, camPos)
    let finish = vec3( genUniformRand(-2, 2), 2 + genUniformRand(-2, 2), genUniformRand(-2, 2))
    //let finish = genRandPointInsideFrustrum(proj, camPos)

    let dir = normalize(subtract(finish, pos))
    let s = 1;
    let v = scale(s, dir);


    for(let i = 0; i < size; i++)
    {
        let offsetPos = add(vec3(genUniformRand(-0.2, 0.2), genUniformRand(-0.2, 0.2), genUniformRand(-0.2, 0.2) ), pos)
        birds.push(new Bird(offsetPos, v, vec4(1.0, 0, 0, 1.0), 0.05));
    }
}








export {createCharacterFeature, Bird, BoundingSphere, birds, obstacles, spawnFlock, Wing}