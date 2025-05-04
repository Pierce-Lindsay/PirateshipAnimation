
//globals

//matrices for catmull and uniformBSPline
const catmullMat = [[-0.5, 3.0/2.0, -3.0/ 2.0, 0.5 ],
    [1.0, -5.0/2.0, 2.0, -0.5],
    [-0.5, 0.0, 0.5, 0.0],
    [0.0, 1.0, 0.0, 0.0]];

const uniformBMat = [[-1.0/6.0, 0.5, -0.5, 1.0/6.0],
    [0.5, -1, 0.5, 0],
    [-0.5, 0.0, 0.5, 0.0],
    [1.0/6.0, 2.0/3.0, 1.0/6.0, 0.0]];


//returns new shape, created by making a square from inputed vertices composed of two triangles
function square(vertices)
{
    let newVerts = [vertices[0], vertices[2], vertices[1]];
    newVerts = newVerts.concat([vertices[0], vertices[3], vertices[2]]);
    return newVerts;
}


//returns a number of vertexColors according to inputed color and amount
function genNumberColor(color, amount)
{
    let colors = []
    for(let i =0; i < amount; i++)
    {
        colors.push(color);
    }
    return colors;
}




//creates a cube with each side a different color
function createCube()
{
    //actual points that comprise cube

    let TLB = vec4(-0.5, 0.5, 0.5, 1.0)

    let TRB = vec4(0.5, 0.5, 0.5, 1.0)
    let BRB = vec4(0.5, -0.5, 0.5, 1.0)
    let BLB = vec4(-0.5, -0.5, 0.5, 1.0)

    let TLF = vec4(-0.5, 0.5, -0.5, 1.0)
    let TRF = vec4(0.5, 0.5, -0.5, 1.0)
    let BRF = vec4(0.5, -0.5, -0.5, 1.0)
    let BLF = vec4(-0.5, -0.5, -0.5, 1.0)

    let vertices = [];
    let colors = [];

    vertices = vertices.concat(square([TLB, TRB, BRB, BLB]));
    colors = colors.concat(genNumberColor( vec4(0.9, 0.1, 0.1, 1.0), 6));

    vertices = vertices.concat(square([BLB, BLF, TLF, TLB]));
    colors = colors.concat(genNumberColor( vec4(0.1, 0.9, 0.1, 1.0), 6));

    vertices = vertices.concat(square([TLB, TLF, TRF, TRB]));
    colors = colors.concat(genNumberColor( vec4(0.1, 0.1, 0.9, 1.0), 6));

    vertices = vertices.concat(square([TRB, TRF, BRF, BRB]));
    colors = colors.concat(genNumberColor( vec4(0.9, 0.9, 0.1, 1.0), 6));

    vertices = vertices.concat(square([BRB, BRF, BLF, BLB]));
    colors = colors.concat(genNumberColor( vec4(0.1, 0.9, 0.9, 1.0), 6));

    vertices = vertices.concat(square([BRF, TRF, TLF, BLF]));
    colors = colors.concat(genNumberColor( vec4(0.9, 0.1, 0.9, 1.0), 6));

    return [vertices, colors];
}

function createCylinder() {

    let points = 32;

    let topCircle = [];
    let bottomCircle = [];

    for (let i = 0; i <= points; i++) {

        let angle = i * 2 * Math.PI / points;

        let x = Math.cos(angle);
        let z = Math.sin(angle);

        topCircle.push(vec4(x, 1.0, z, 1.0));
        bottomCircle.push(vec4(x, 0.0, z, 1.0));
    }

    let vertices = [];

    for (let i = 0; i < points; i++) {
        vertices = vertices.concat(square([topCircle[i+1], topCircle[i], bottomCircle[i], bottomCircle[i+1]]));
    }

    let inverse = [];

    for (let i = 0; i < points; i++) {
        inverse = inverse.concat(square([topCircle[i], topCircle[i+1], bottomCircle[i+1], bottomCircle[i]]));
    }

    return [vertices, inverse];
}

function createBall() {
    const r = 0.05;
    const slices = 20;
    let vertices = [];
    let normals = [];
    for (let i = 0; i < slices; i++) {
        let theta1 = (i / slices) * 2 * Math.PI;
        let theta2 = ((i + 1) / slices) * 2 * Math.PI;

        vertices.push(vec4(0, 0, 0, 1),
            vec4(r * Math.cos(theta1), r * Math.sin(theta1), 0, 1),
            vec4(r * Math.cos(theta2), r * Math.sin(theta2), 0, 1));
        normals.push(vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1));
    }

    return vertices;
}

//multiply matrix with vertical vector
function verticalMat4Vec4Dot(v, mat)
{
    return vec4(dot(v, mat[0]), dot(v, mat[1]), dot(v, mat[2]), dot(v, mat[3]));
}


//interpolate according to sp;ine with given matrix and set of 4 points
function interpolate(points, t, matrix)
{
    let newM = structuredClone(matrix);

    let tCube = Math.pow(t, 3);
    let tSqr = Math.pow(t, 2);

    let tVec = vec4(tCube, tSqr, t, 1)

    //get x, y, z values after multiplying with matrix
    let vx = vec4(points[0][0], points[1][0], points[2][0], points[3][0]);
    let vy = vec4(points[0][1], points[1][1], points[2][1], points[3][1]);
    let vz = vec4(points[0][2], points[1][2], points[2][2], points[3][2]);

    //get x, y, z values after multiplying with t
    let tx = verticalMat4Vec4Dot(vx, newM);
    let ty = verticalMat4Vec4Dot(vy, newM);
    let tz = verticalMat4Vec4Dot(vz, newM);

    return vec4(dot(tx, tVec), dot(ty, tVec), dot(tz, tVec), 1.0);
}



//function created from math from wikipedia, converts euler angles to quanternion in form [x, y, z, w]
function convertFromEulertoQuanterion(angles)
{

    let pitch = radians(angles[1]);
    let yaw = radians(angles[2]);
    let roll = radians(angles[0]);

    let cr = Math.cos(roll/2)
    let cp = Math.cos(pitch/2)
    let cy = Math.cos(yaw/2)

    let sr = Math.sin(roll/2)
    let sp = Math.sin(pitch/2)
    let sy = Math.sin(yaw/2)

   let w  = cr * cp * cy + sr * sp * sy;
   let x =  sr * cp * cy - cr * sp * sy;
   let y = cr * sp * cy + sr * cp * sy;
   let z = cr * cp * sy - sr * sp * cy;

    return vec4(x, y, z, w);
}


//slerp function, takes in two quanternion, and mix factor t
function slerp(q1, q2, t) {

    //find dot between qs
    let theta = dot(q1, q2);

    //clamp t
    if(t > 1)
        t = 1;
    if(t<0)
        t = 0;

    //slerp math
    let f1 = Math.sin((1-t) * theta)/Math.sin(theta)
    let f2 = Math.sin(t * theta)/Math.sin(theta);
    q1 = vec4(q1[0] * f1, q1[1] * f1, q1[2] * f1, q1[3] * f1);
    q2 = vec4(q2[0] * f2, q2[1] * f2, q2[2] * f2, q2[3] * f2);

    let added = add(q1, q2);

    if(length(added) === 0)
        return added;
    else
        return normalize(added);
}



//class from handling spline object
class Spline
{
    constructor(time, vertices, axisAngles)
    {
        this.time = time;
        this.vertices = vertices;
        this.axisAngles = axisAngles;
    }

    //clamps points from an array so they have circular relationship
    clampToCircle(index)
    {
        if(index < 0)
            return this.vertices.length + index;
        else if(index >= this.vertices.length)
            return this.vertices.length-1;
        else return index;
    }

    //clamped to circles so we get nice loops
    findPointsToUse(point1Position, catmull)
    {
            //p0, p1, p2, p3
        let pminus1 = this.vertices[this.clampToCircle(point1Position - 1)];
        let p0 = this.vertices[this.clampToCircle(point1Position)];
        let p1 = this.vertices[this.clampToCircle(point1Position + 1)];
        let p2 = this.vertices[this.clampToCircle(point1Position + 2)];
        let p3 = this.vertices[this.clampToCircle(point1Position + 3)];

        if(catmull)
            return [pminus1, p0, p1, p2]
        else
            return [p0, p1, p2, p3]
    }
    //returns vec4

    //pass in boolean for whether to use catmull or uniformB matrix
    getPosition(t, catmull)
    {

        //each segement of the curve is between each set of two points

        let buckets = this.vertices.length - 1;

        let ratio = buckets/this.time;
        //include time and buckets to find correct spot in spline
        t *= ratio;


        let floorT =Math.floor(t);
        //find what bucket we fall in
        let bucketPos = (floorT % buckets);
        //fractional of 1
        let bucketT = t - floorT;

        //to get the uniformBSpline, to be a complete loop, we need to start a little further back in the array
        let posToUse = bucketPos-1;
        if(catmull)
            posToUse += 2;

        let pointsToUse = this.findPointsToUse(posToUse, catmull);

        //use correct matrix
        let m = catmullMat;
        if(!catmull)
            m = uniformBMat;


        //find point using interpolation
        return interpolate(pointsToUse, bucketT, m);
    }

    getRotation(t)
    {
        //a bucket for each of our 12-1 orientations
        let buckets = this.axisAngles.length - 1;
        let floorT =Math.floor(t);
        //find what bucket we fall in
        let bucketPos = (floorT % buckets);
        //fractional of 1
        let bucketT = t - floorT;

        //find adjacent rotations
        let q1 = convertFromEulertoQuanterion(this.axisAngles[bucketPos])
        let q2 = convertFromEulertoQuanterion(this.axisAngles[bucketPos+1])

        return quatToMatrix(slerp(q1, q2, bucketT));
    }
}


export{ square, createCube, createCylinder, createBall, Spline, convertFromEulertoQuanterion , slerp}

