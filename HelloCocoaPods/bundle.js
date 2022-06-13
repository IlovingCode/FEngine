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
    addRenderer(node.id, 'image.ktx2')
    root.addChild(node)

    let child = new Node(createEntity(node.id))
    addRenderer(child.id, 'image.ktx2')
    node.addChild(child)
    
    child.position.x = 3
    
    let child1 = new Node(createEntity(child.id))
    addRenderer(child1.id, 'image.ktx2')
    child.addChild(child1)
    
    child1.position.y = 3
    
    let a = child.toArray()
    a.push(...child1.toArray())
    updateTransforms(new Float32Array(a))
}

function abs(num) {
    return num > 0 ? num : -num
}

var t = 0

var update = function (dt) {
    let a = []
    
    let target0 = root.children[1]
//    target.rotation.z += .01
    
    a.push(...target0.toArray())
    
    let target1 = target0.children[0]
    target1.rotation.z += .01
    
    a.push(...target1.toArray())
    
    let target2 = target1.children[0]
    t += dt
    target2.position.y = abs((t % 10) - 5)

    a.push(...target2.toArray())
    
    updateTransforms(new Float32Array(a))

//    log(dt)
}

init()
