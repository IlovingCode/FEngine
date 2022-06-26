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
    native = new Float32Array(new ArrayBuffer(40))
    
    constructor(id = -1) {
        this.id = id
        this.native[0] = id
    }
    
    addChild(node) {
        this.children.push(node)
    }
    
    toArray = function() {
        let p = this.position
        let r = this.rotation
        let s = this.scale
        
        let native = this.native
        native[1] = p.x
        native[2] = p.y
        native[3] = p.z
        native[4] = r.x
        native[5] = r.y
        native[6] = r.z
        native[7] = s.x
        native[8] = s.y
        native[9] = s.z
        
        return native
    }
}

let root = new Node

var init = function() {
    beginScene()
    
    let node = new Node(createEntity())
    addCamera(node.id)
    root.addChild(node)
    
    node = new Node(createEntity())
    addRenderer(node.id, 'image.ktx2', 200, 200)
    root.addChild(node)

    let child = new Node(createEntity(node.id))
    addRenderer(child.id, 'image.ktx2', 200, 200)
    node.addChild(child)
    
    child.position.x = 300
    
    let child1 = new Node(createEntity(child.id))
    addRenderer(child1.id, 'image.ktx2', 200, 200)
    child.addChild(child1)
    
    child1.position.y = 300
}

function abs(num) {
    return num > 0 ? num : -num
}

var input = {x: 0, y: 0, state: 3}

var resizeView = function(width, height) {
    let designWidth = 640;
    let designHeight = 960;
    
    let fit_width = width < height;
    let aspect = width / height;
    let ZOOM = fit_width ? designWidth : designHeight;
    
    width  =  fit_width ? ZOOM : (ZOOM * aspect);
    height =  fit_width ? (ZOOM / aspect) : ZOOM;
    
    updateCamera(root.children[0].id, width, height);
}

var transformBuffer = null
var bufferLength = 0

var sendUpdateTransform = function(list) {
    let length = list.length * 10
    if(bufferLength != length) {
        transformBuffer = new Float32Array(length)
        bufferLength = length
    }
    
    let offset = 0
    for(let i of list) {
        transformBuffer.set(i.toArray(), offset)
        offset += 10
    }
    
    updateTransforms(transformBuffer)
}

var t = 0

var update = function (dt) {
    let a = []
    
    let target0 = root.children[1]
    target0.rotation.z += .01
    
    a.push(target0)
    
    let target1 = target0.children[0]
    target1.rotation.z += .01
    
    a.push(target1)
    
    let target2 = target1.children[0]
    t += dt * 100
    target2.position.y = abs((t % 1000) - 500)

    a.push(target2)
    
    a.length > 0 && sendUpdateTransform(a)
//    log(dt)
}

init()
