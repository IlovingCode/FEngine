// test

class Vec3 {
    x = 0
    y = 0
    z = 0
    
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }
}

class Node {
    id = 0
    position = new Vec3(0, 0, 0)
    rotation = new Vec3(0, 0, 0)
    scale = new Vec3(1, 1, 1)
    children = []
    
    constructor(id = -1) {
        this.id = id
    }
    
    addChild(node) {
        this.children.push(node)
    }
    
    toArray = function() {
        let p = this.position
        let r = this.rotation
        let s = this.scale
        return [this.id, p.x, p.y, p.z, r.x, r.y, r.z, s.x, s.y, s.z]
    }
}

let root = new Node

var init = function() {
    beginScene()

    let node = new Node(createEntity())
    addCamera(node.id)
    root.addChild(node)
    
    node = new Node(createEntity())
    addRenderer(node.id)
    root.addChild(node)
    
//    node = new Node(createEntity())
//    addRenderer(node.id)
//    root.addChild(node)
}

var update = function (dt) {
//    updateTransforms(new Float32Array(node.toArray()))
//    log(dt)
}

init()
