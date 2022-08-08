// test

class Vec4 {
    x = 0; y = 0; z = 0; w = 0

    constructor(x, y, z, w) { this.set(x, y, z, w) }

    set(x, y, z, w) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }

    copy(target) { this.set(target.x, target.y, target.z, target.w) }

    clone() { return new Vec4(this.x, this.y, this.z, this.w) }
}

class Vec3 {
    x = 0; y = 0; z = 0

    constructor(x, y, z) { this.set(x, y, z) }

    set(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }

    copy(target) { this.set(target.x, target.y, target.z) }

    clone() { return new Vec4(this.x, this.y, this.z) }
}

class Vec2 {
    x = 0; y = 0

    constructor(x, y) { this.set(x, y) }

    set(x, y) {
        this.x = x
        this.y = y
    }

    copy(target) { this.set(target.x, target.y) }

    clone() { return new Vec4(this.x, this.y) }
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

    getComponent(prototype) {
        for (let i of this.components) if (i instanceof prototype) return i
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

class BoundBox2D extends Component {
    size = null
    anchor = null
    onSizeChanged = null

    top = 0
    bottom = 0
    left = 0
    right = 0

    constructor(node, size, anchor) {
        super(node)

        this.size = size
        this.anchor = anchor

        this.update(size.x, size.y, anchor.x, anchor.y)
    }

    update(width, height, anchorX, anchorY) {
        this.top = height * (1. - anchorY)
        this.bottom = -height * anchorY
        this.left = -width * anchorX
        this.right = width * (1. - anchorX)
    }

    set(width = -1, height = -1, anchorX = -1, anchorY = -1) {
        let size = this.size
        let anchor = this.anchor

        if (width < 0) width = size.x
        else if (width == 0) width = height * size.x / size.y

        if (height < 0) height = size.y
        else if (height == 0) height = width * size.y / size.x

        if (anchorX < 0) anchorX = anchor.x
        else anchorX = Math.min(anchorX, 1)

        if (anchorY < 0) anchorY = anchor.y
        else anchorY = Math.min(anchorY, 1)

        size.x = width
        size.y = height
        anchor.x = anchorX
        anchor.y = anchorY

        return this.update(width, height, anchorX, anchorY)
    }
}

class Mask extends Component {
    bound = null

    constructor(node, width, height) {
        super(node)

        let bound = node.getComponent(BoundBox2D)
        if (!bound) bound = new BoundBox2D(node, new Vec2(width, height), new Vec2(.5, .5))

        this.bound = bound

        this.set(bound)
    }

    set(bound) {
        let left = bound.left
        let bottom = bound.bottom
        let width = bound.right - left
        let height = bound.top - bottom
        let array = []

        let nodes = [this.node]
        while (nodes.length > 0) {
            let p = nodes.shift()
            if (p.getComponent(SpriteSimple) || p.getComponent(SpriteSliced))
                array.push(p.id())

            for (let i of p.children) nodes.push(i)
        }

        globalThis.updateScissor(new Uint32Array(array), left, bottom, width, height)
    }
}

class SpriteSimple extends Component {
    vb = null
    native = null
    bound = null

    constructor(node, image, width, height) {
        super(node)

        let bound = node.getComponent(BoundBox2D)
        if (!bound) bound = new BoundBox2D(node, new Vec2(width, height), new Vec2(.5, .5))
        else bound.set(width, height)

        this.bound = bound

        this.vb = this.createData()
        this.native = globalThis.addRenderer(node.id(), this.fillBuffer(bound), image)
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

    fillBuffer(bound) {
        let top = bound.top
        let bottom = bound.bottom
        let left = bound.left
        let right = bound.right

        let vb = this.vb
        vb[0] = left, vb[1] = bottom
        vb[4] = right, vb[5] = bottom
        vb[8] = left, vb[9] = top
        vb[12] = right, vb[13] = top

        return vb
    }

    // setSprite(image, width, height) {
    //     globalThis.updateRenderer(this.native, this.fillBuffer(width, height))
    // }
}

class SpriteSliced extends Component {
    vb = null
    native = null
    top = 0
    bottom = 0
    left = 0
    right = 0
    bound = null

    constructor(node, image, width, height, top, bottom, left, right) {
        super(node)

        this.top = top
        this.bottom = bottom
        this.left = left
        this.right = right

        let bound = node.getComponent(BoundBox2D)
        if (!bound) bound = new BoundBox2D(node, new Vec2(width, height), new Vec2(.5, .5))

        this.bound = bound

        this.vb = this.createData()
        this.native = globalThis.addRenderer(node.id(), this.fillBuffer(bound), image)
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

    fillBuffer(bound) {
        let top = this.top
        let bottom = this.bottom
        let left = this.left
        let right = this.right
        let size = bound.size
        let width = top + bottom
        let height = left + right

        if (width > size.x || height > size.y) {
            bound.set(Math.max(size.x, width), Math.max(size.y, height))
        }

        let btop = bound.top
        let bbottom = bound.bottom
        let bleft = bound.left
        let bright = bound.right

        let vb = this.vb
        vb[0] = bleft, vb[1] = btop - top
        vb[4] = bleft + left, vb[5] = btop - top
        vb[8] = bleft, vb[9] = btop
        vb[12] = bleft + left, vb[13] = btop
        vb[16] = bright - right, vb[17] = btop - top
        vb[20] = bright, vb[21] = btop - top
        vb[24] = bright - right, vb[25] = btop
        vb[28] = bright, vb[29] = btop
        vb[32] = bleft, vb[33] = bbottom
        vb[36] = bleft + left, vb[37] = bbottom
        vb[40] = bleft, vb[41] = bbottom + bottom
        vb[44] = bleft + left, vb[45] = bbottom + bottom
        vb[48] = bright - right, vb[49] = bbottom
        vb[52] = bright, vb[53] = bbottom
        vb[56] = bright - right, vb[57] = bbottom + bottom
        vb[60] = bright, vb[61] = bbottom + bottom

        return vb
    }

    // setSprite(image, width, height) {
    //     globalThis.updateRenderer(this.native, this.fillBuffer(width, height))
    // }
}


let root = new Node
let camera = null

var init = function () {
    beginScene()

    let node = root.addChild()
    camera = new Camera(node)

    node = root.addChild()
    // new SpriteSliced(node, 'image.ktx2', 192, 194, 80, 80, 80, 80)
    new SpriteSimple(node, 'image.ktx2', 192, 194)

    new Mask(root, 100, 100)
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

    a.push(target0)

    a.length > 0 && sendUpdateTransform(a)
}

init()
