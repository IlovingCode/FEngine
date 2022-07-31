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

class SpriteSliced extends Component {
    vb = null
    native = null
    top = 0
    bottom = 0
    left = 0
    right = 0

    constructor(node, image, width, height, top, bottom, left, right) {
        super(node)

        this.top = top
        this.bottom = bottom
        this.left = left
        this.right = right

        this.vb = this.createData()
        this.fillBuffer(width, height)
        this.native = globalThis.addRenderer(node.id(), this.vb, image)
    }

    createData() {
        let array = [
            0, 0, 0, 0,  //0
            0, 0, 1, 0,  //1
            0, 0, 0, 1,  //2
            0, 0, 1, 1,  //3
            0, 0, 0, 0,  //4
            0, 0, 1, 0,  //5
            0, 0, 0, 1,  //6
            0, 0, 1, 1,  //7
            0, 0, 0, 0,  //8
            0, 0, 1, 0,  //9
            0, 0, 0, 1,  //10
            0, 0, 1, 1,  //11
            0, 0, 0, 0,  //12
            0, 0, 1, 0,  //13
            0, 0, 0, 1,  //14
            0, 0, 1, 1,  //15
        ]
        return new Float32Array(array)
    }

    fillBuffer(width, height) {
        let top = this.top
        let bottom = this.bottom
        let left = this.left
        let right = this.right

        width = Math.max(width, top + bottom) * .5
        height = Math.max(height, left + right) * .5

        let vb = this.vb
        vb[0] = -width, vb[1] = height - top
        vb[4] = -width + left, vb[5] = height - top
        vb[8] = -width, vb[9] = height
        vb[12] = -width + left, vb[13] = height
        vb[16] = width - right, vb[17] = height - top
        vb[20] = width, vb[21] = height - top
        vb[24] = width - right, vb[25] = height
        vb[28] = width, vb[29] = height
        vb[32] = -width, vb[33] = -height
        vb[36] = -width + left, vb[37] = -height
        vb[40] = -width, vb[41] = -height + bottom
        vb[44] = -width + left, vb[45] = -height + bottom
        vb[48] = width - right, vb[49] = -height
        vb[52] = width, vb[53] = -height
        vb[56] = width - right, vb[57] = -height + bottom
        vb[60] = width, vb[61] = -height + bottom

        return vb
    }

    setSprite(image, width, height) {
        globalThis.updateRenderer(this.native, this.fillBuffer(width, height))
    }
}

class SpriteSimple extends Component {
    vb = null
    native = null

    constructor(node, image, width, height) {
        super(node)

        this.vb = this.createData()
        this.fillBuffer(width, height)
        this.native = globalThis.addRenderer(node.id(), this.vb, image)
    }

    createData() {
        let array = [
            0, 0, 0, 0,  //0
            0, 0, 1, 0,  //1
            0, 0, 0, 1,  //2
            0, 0, 1, 1,  //3
        ]
        return new Float32Array(array)
    }

    fillBuffer(width, height) {
        width *= .5
        height *= .5

        let vb = this.vb
        vb[0] = -width, vb[1] = -height
        vb[4] = width, vb[5] = -height
        vb[8] = -width, vb[9] = height
        vb[12] = width, vb[13] = height
    }

    setSprite(image, width, height) {
        globalThis.updateRenderer(this.native, this.fillBuffer(width, height))
    }
}

let root = new Node
let camera = null

var init = function () {
    beginScene()

    let node = root.addChild()
    camera = new Camera(node)

    node = root.addChild()
    new SpriteSliced(node, 'image.ktx2', 192, 194, 80, 80, 80, 80)
}

var input = { x: 0, y: 0, state: 3 }

var resizeView = function (width, height) {
    camera.resize(width, height)
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
    t += dt * 100

    let target0 = root.children[1]
    target0.rotation.z += .01

    target0.components[0].setSprite(null, 200 + Math.abs((t % 100) - 50), 200 + Math.abs((t % 100) - 50))
    a.push(target0)

    a.length > 0 && sendUpdateTransform(a)
}

init()
