
//all objects use same camera so just make it global
let cameraMatrix;
let projMatrix;



//creates model matrix given rotation dialation, rotation, translation
class Transform
{
    //save vars for initial states as well as the ones the will change
    constructor(pos, scale, rotation, rotAxis = vec3(0.0, 0.0, 1.0))
    {
        this.posInitial = structuredClone(pos)
        this.scaleInitial = structuredClone(scale)
        this.rotationInitial = rotation
        this.rotAxis = rotAxis

        this.pos = structuredClone(pos);
        this.rotation = structuredClone(rotation);
        this.scale = structuredClone(scale);

        this.rotMat = mat4(1.0);
    }

    //adds to current rotation by rot
    rotate(rot)
    {
        this.rotation += rot;

        //update rotmat

        this.rotMat = rotate(this.rotation, this.rotAxis);
    }

    //set the rotation of object
    setRotate(rot)
    {
        this.rotation = rot;

        //update rotmat

        this.rotMat = rotate(this.rotation, this.rotAxis);
    }

    //set rotation axis
    setRotAxis(rotAxis)
    {
        this.rotAxis = rotAxis;
    }

    //takes in a vec3 delta and adds it to the position
    move(delta)
    {
        this.pos = add(this.pos, delta);
    }

    setPos(pos)
    {
        this.pos = structuredClone(pos)
    }


    //uniformly scales
    scaleUniform(scaleDelta)
    {
        //clamp if neccessary
        this.scale[0] = this.scale[0] + scaleDelta;
        this.scale[1] = this.scale[1] + scaleDelta;
        this.scale[2] = this.scale[2] + scaleDelta;
    }

    //sets teh rotation matrix
    setRotMat(mat)
    {
       // console.log(mat);
        this.rotMat = mat;
    }


    //reset back to initial values
    reset()
    {
        this.rotation = this.rotationInitial;
        this.pos = structuredClone(this.posInitial);
        this.scale = structuredClone(this.scaleInitial);
    }

    //returns model mat accociated with this transform
    get modelMat()
    {

        return mult(translate(this.pos[0] , this.pos[1], this.pos[2]), mult(this.rotMat,
            (scalem(this.scale[0], this.scale[1], this.scale[2]))))
    }
}



//setters allowing other modules to change these vars
function setProjection(proj)
{
    projMatrix = proj;
}

function setCamera(cam)
{
    cameraMatrix = cam;
}

export{Transform, projMatrix, cameraMatrix, setProjection, setCamera}