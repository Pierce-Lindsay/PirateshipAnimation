import {Obj} from "./Object.js"
import {setProjection, setCamera, projMatrix, cameraMatrix, Transform} from './Transformer.js';


//skeleton class for handling many bones all linked together
class Skeleton {
    //pass in a list of lengths, freedoms, and objects to attach to bones and starting pos
    constructor(startingPoint, lengths, freedoms, objects) {
        this.bones = [];
        this.skeletonLength = lengths.length

        for (let i = 0; i < this.skeletonLength; i++) {
            let parent = null;
            let start = startingPoint;
            if (i > 0) {
                parent = this.bones[i - 1];
                //placeholder, does nothing
                start = vec3(0, 0, 0);
            }
            this.bones.push(new Bone(start, lengths[i], freedoms[i], parent));
            this.bones[i].addFlesh(objects[i]);
        }
    }

    //takes in list of rotations(rotations are relative) to set bones to, must be same length as the skeleton
    animateSkeleton(rotations) {
        //note, must be updated in order from base to end
        for (let i = 0; i < rotations.length; i++) {
            this.bones[i].animate(rotations[i]);
        }
    }

}

//acts like a node in a singly linked list
class Bone
{
    constructor(jointPos, length, axisOfFreedom, jointParent)
    {

        this.jointParent = jointParent
        this.jointPos = jointPos;
        this.length = length;
        this.rotation = 0;
        this.rotAxis = axisOfFreedom;

        //only does something if parent != null
        this.jointPos = this.getJointPointPosition();

        this.endStartingPoint = add(this.jointPos, vec3(this.length, 0, 0));


    }

    //rotations are reletive!
    //sets a rotation to set bone to
    animate(rotation)
    {

        //moves the arm from 0 degrees to rotation and then access previous links to find correct position
        this.rotation = rotation;
        let pos = this.getFleshPos()
        this.flesh.trans.setPos(pos);
        this.flesh.trans.setRotAxis(this.rotAxis)
        this.flesh.trans.setRotate(rotation);
    }

    //calculates endpoint given proper joint position from parents
    calculateEndPoint()
    {
        //start pos is joint position
        //with no rotation
        this.endStartingPoint = add(this.jointPos, vec3(this.length, 0, 0));
        //rotate about 0, 0, then  translate

        //rotate about the origin

        let nonMovedRelativeToOrigin = vec4(this.length,0,0,1 );
        let newVec = mult(rotate(this.rotation, this.rotAxis), nonMovedRelativeToOrigin);
        //translate back using joint pos
        return add(vec3(newVec[0], newVec[1], newVec[2]), this.jointPos);
    }

    //returns endPoint
    getEndPointPosition()
    {
        if(this.jointParent == null)
            return  this.calculateEndPoint();
        else
        {
           this.jointPos = this.getJointPointPosition();
           return this.calculateEndPoint();
        }

    }

    //gets correct jint position from parent's endpoint
    getJointPointPosition()
    {
        if(this.jointParent == null)
            return  this.jointPos;
        else
        {
            return this.jointParent.getEndPointPosition();
        }
    }

    //adds a obj whos position and rotation is controlled by this bones rotation and position
    addFlesh(flesh)
    {
        this.flesh = flesh;
    }

    getFleshPos()
    {
        //center between jointPoint and EndPoint for now
        let end = this.getEndPointPosition()
        let start = this.getJointPointPosition()
        return scale(0.5, add(end, start));
    }
}

export {Bone, Skeleton}
