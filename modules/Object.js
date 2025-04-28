import {Transform} from './Transformer.js';
import {Renderable} from './Renderable.js';

//global id to ensure no object ever has the same id and to differentiate them
let id = 0

//class for hierarchical relationships
class Obj
{
    constructor(renderable, transformer, parent = null)
    {
        this.renderable = renderable;
        this.trans = transformer;
        this.parent = parent;
        this.shouldDraw = true;
        this.children = [];
        this.id = id;
        id++;
    }


    setParent(parent)
    {
        this.parent = parent;
    }

    addChild(child)
    {
        this.children.push(child);
    }

    //draw this object and all its children
    drawAll()
    {
        if(this.shouldDraw)
        {
            this.drawThisOnly()
            for(let i = 0; i < this.children.length; i++)
                this.children[i].drawAll();
        }

    }
    //draw only this object
    drawThisOnly()
    {
        this.renderable.draw(this.hierarchyModel())
    }


    //reset our transformer(sets model to an identity matrix)
    resetTrans()
    {
        this.trans = new Transform(vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), 0.0);
    }


    hierarchyModel()
    {
        if(this.parent == null)
            return this.trans.modelMat
        else
            return mult(this.parent.hierarchyModel(), this.trans.modelMat)
    }


}

export{Obj};