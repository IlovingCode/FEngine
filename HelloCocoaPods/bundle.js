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
    position = new Vec3(0, 0, 0)
    rotation = new Vec3(0, 0, 0)
    scale = new Vec3(1, 1, 1)
    children = []
    components = []
    native = new Float32Array(new ArrayBuffer(40))

    constructor(id = -1) {
        this.native[0] = id
    }

    id() { return this.native[0] }

    addChild(node) {
        if (!node) {
            let id = this.id()
            id = id < 0 ? globalThis.createEntity() : globalThis.createEntity(id)
            node = new Node(id)
        }
        this.children.push(node)

        return node
    }

    addComponent(component) {
        this.components.push(component)
    }

    toArray = function () {
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

class Component {
    enabled = false
    node = null

    constructor(node) {
        this.node = node
        node.addComponent(this)
        this.enabled = true
    }
}

class Camera extends Component {
    designWidth = 640
    designHeight = 960

    constructor(node) {
        super(node)

        globalThis.addCamera(node.id())
    }

    resize(width, height) {
        let fit_width = width < height
        let aspect = width / height
        let ZOOM = fit_width ? this.designWidth : this.designHeight

        width = fit_width ? ZOOM : (ZOOM * aspect)
        height = fit_width ? (ZOOM / aspect) : ZOOM
        globalThis.updateCamera(this.node.id(), width, height)
    }
}

class Sprite extends Component {
    vb = null

    constructor(node, image, width, height) {
        super(node)

        this.vb = this.createData(width, height)
        globalThis.addRenderer(node.id(), this.vb, image)
    }

    createData(width, height) {
        width *= .5
        height *= .5
        let array = [
            -width, -height, 0, 0,
            width, -height, 1, 0,
            -width, height, 0, 1,
            width, height, 1, 1,
        ]
        return new Float32Array(array)
    }

    setSprite(image, width, height) {
        width *= .5
        height *= .5
        // let array = [
        //     -width, -height, 0, 0,
        //     width, -height, 1, 0,
        //     -width, height, 0, 1,
        //     width, height, 1, 1,
        // ]

        let vb = this.vb
        vb[0] = -width
        vb[1] = -height
        vb[4] = width
        vb[5] = -height
        vb[8] = -width
        vb[9] = height
        vb[12] = width
        vb[13] = height

        // globalThis.log(width)
    }
}

let root = new Node
let camera = null

var init = function () {
    beginScene()

    camera = root.addChild()
    new Camera(camera)

    let node = root.addChild()
    new Sprite(node, 'image.ktx2', 200, 200)

    let child = node.addChild()
    new Sprite(child, 'image.ktx2', 200, 200)

    child.position.x = 300

    let child1 = child.addChild()
    new Sprite(child1, 'image.ktx2', 200, 200)

    child1.position.y = 300
}

function abs(num) {
    return num > 0 ? num : -num
}

var input = { x: 0, y: 0, state: 3 }

var resizeView = function (width, height) {
    camera.components[0].resize(width, height)
}

var transformBuffer = null
var bufferLength = 0

var sendUpdateTransform = function (list) {
    let length = list.length * 10
    if (bufferLength != length) {
        transformBuffer = new Float32Array(length)
        bufferLength = length
    }

    let offset = 0
    for (let i of list) {
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
    target1.components[0].setSprite(null, abs((t % 200) - 100), abs((t % 200) - 100))

    a.push(target1)

    let target2 = target1.children[0]
    t += dt * 100
    target2.position.y = abs((t % 1000) - 500)
    

    a.push(target2)

    a.length > 0 && sendUpdateTransform(a)
    //    log(dt)
}

init()
