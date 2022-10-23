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
    worldPosition = new Vec3(0, 0, 0)

    position = new Vec3(0, 0, 0)
    rotation = new Vec3(0, 0, 0)
    scale = new Vec3(1, 1, 1)
    parent = null
    children = []
    components = []
    native = new Float32Array(new ArrayBuffer(40))
    isDirty = true
    active = true
    globalActive = true

    constructor(id = -1) {
        this.native[0] = id
    }

    id() { return this.native[0] }

    setActive(enabled) {
        if (this.active == enabled) return

        this.active = enabled
        this.onActive(this.parent.globalActive && enabled)    
    }

    onActive(enabled) {
        if(this.globalActive == enabled) return
        this.globalActive = enabled

        for(let i of this.components) {
            if(i.enabled) {
                i.onEnableChanged && i.onEnableChanged(enabled)
            }
        }

        for(let i of this.children) {
            i.active && i.onActive(enabled)
        }
    }

    addChild(node) {
        if (!node) {
            let id = this.id()
            id = id < 0 ? globalThis.createEntity() : globalThis.createEntity(id)
            node = new Node(id)
        }

        this.children.push(node)
        node.parent = this

        return node
    }

    addComponent(component) {
        this.components.push(component)
    }

    getComponent(prototype) {
        for (let i of this.components) if (i instanceof prototype) return i
    }

    updateWorld() {
        let worldTransform = globalThis.getWorldTransform(this.native)

        let worldPos = this.worldPosition
        worldPos.x = worldTransform[1]
        worldPos.y = worldTransform[2]
        worldPos.z = worldTransform[3]

        return worldPos
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
    // enabled = false
    // node = null

    constructor(node) {
        this.node = node
        node.addComponent(this)
        this.enabled = true
    }

    setEnable(enabled) {
        if (this.enabled == enabled) return

        this.enabled = enabled
        this.onEnableChanged && this.onEnableChanged(enabled)
    }
}

class Camera extends Component {
    constructor(node) {
        super(node)

        globalThis.addCamera(node.id())
    }
}

class BoundBox2D extends Component {
    // size = null
    // pivot = null
    onBoundChanged = null

    horizontalAlign = 0
    verticalAlign = 0

    _top = 0
    _bottom = 0
    _left = 0
    _right = 0

    // top = 0
    // bottom = 0
    // left = 0
    // right = 0

    constructor(node, size, pivot) {
        super(node)

        this.size = size
        this.pivot = pivot

        this.updateBound(size.x, size.y, pivot.x, pivot.y)
    }

    checkInside(x, y) {
        let pos = this.node.worldPosition
        x -= pos.x
        y -= pos.y

        return x < this.right && x > this.left
            && y < this.top && y > this.bottom
    }

    setAlignment(vertical, horizontal, top, bottom, left, right) {
        this.horizontalAlign = horizontal
        this.verticalAlign = vertical

        let node = this.node
        let parent = node.parent.getComponent(BoundBox2D)
        let pSize = parent.size
        let size = this.size
        let pivot = this.pivot

        if (vertical == 1) {
            bottom = pSize.y - (size.y + top)
        }

        if (vertical == -1) {
            top = pSize.y - (size.y + bottom)
        }

        if (horizontal == 1) {
            left = pSize.x - (size.x + right)
        }

        if (horizontal == -1) {
            right = pSize.x - (size.x + left)
        }

        if (horizontal > 1) {
            size.x = pSize.x - (left + right)
        }

        if (vertical > 1) {
            size.y = pSize.y - (top + bottom)
        }

        if (vertical != 0) {
            node.position.y = (parent.bottom + bottom) + size.y * pivot.y
            node.isDirty = true
        }

        if (horizontal != 0) {
            node.position.x = (parent.left + left) + size.x * pivot.x
            node.isDirty = true
        }

        this._top = top
        this._bottom = bottom
        this._left = left
        this._right = right

        this.updateBound(size.x, size.y, pivot.x, pivot.y)

        let children = this.node.children
        for (let i of children) {
            let bound = i.getComponent(BoundBox2D)
            let horizontal = bound.horizontalAlign
            let vertical = bound.verticalAlign
            let top = bound._top
            let bottom = bound._bottom
            let left = bound._left
            let right = bound._right

            bound.setAlignment(vertical, horizontal, top, bottom, left, right)
        }
    }

    updateBound(width, height, pivotX, pivotY) {
        this.top = height * (1. - pivotY)
        this.bottom = -height * pivotY
        this.left = -width * pivotX
        this.right = width * (1. - pivotX)

        let cb = this.onBoundChanged
        cb && cb(this)
    }

    setSize(width, height, pivotX, pivotY) {
        let size = this.size
        let pivot = this.pivot

        if (width == 0) width = height * size.x / size.y
        if (height == 0) height = width * size.y / size.x

        size.x = width
        size.y = height
        pivot.x = pivotX
        pivot.y = pivotY

        if (this.node.parent) {
            let horizontal = this.horizontalAlign
            let vertical = this.verticalAlign
            let top = this._top
            let bottom = this._bottom
            let left = this._left
            let right = this._right
            this.setAlignment(vertical, horizontal, top, bottom, left, right)
        } else {
            this.updateBound(width, height, pivotX, pivotY)

            let children = this.node.children
            for (let i of children) {
                let bound = i.getComponent(BoundBox2D)
                if (bound) {
                    let horizontal = bound.horizontalAlign
                    let vertical = bound.verticalAlign
                    let top = bound._top
                    let bottom = bound._bottom
                    let left = bound._left
                    let right = bound._right

                    bound.setAlignment(vertical, horizontal, top, bottom, left, right)
                }
            }
        }
    }
}

// class FastMask extends Component {
//     bound = null

//     constructor(node, width, height) {
//         super(node)

//         let bound = node.getComponent(BoundBox2D)
//         if (!bound) bound = new BoundBox2D(node, new Vec2(width, height), new Vec2(.5, .5))
//         else bound.set(width, height)

//         this.bound = bound

//         this.set(bound)
//     }

//     set(bound) {
//         let left = bound.left
//         let bottom = bound.bottom
//         let width = bound.right - left
//         let height = bound.top - bottom

//         let array = []
//         let nodes = [this.node]
//         while (nodes.length > 0) {
//             let p = nodes.shift()
//             if (p.getComponent(SpriteSimple) || p.getComponent(SpriteSliced))
//                 array.push(p.id())

//             for (let i of p.children) nodes.push(i)
//         }

//         globalThis.updateScissor(new Uint32Array(array), left, bottom, width, height)
//     }
// }

class SpriteSimple extends Component {
    vb = null
    native = null
    isMask = false

    constructor(node, image, width, height) {
        super(node)

        let bound = node.getComponent(BoundBox2D)
        if (!bound) bound = new BoundBox2D(node, new Vec2(width, height), new Vec2(.5, .5))
        else {
            let pivot = bound.pivot
            bound.setSize(width, height, pivot.x, pivot.y)
        }

        bound.onBoundChanged = this.onBoundUpdated.bind(this)

        this.vb = this.createData(image)
        this.native = globalThis.addRenderer(node.id(), this.fillBuffer(bound), image.native)
    }

    onBoundUpdated(bound) {
        let buffer = this.fillBuffer(bound)
        buffer && globalThis.updateRenderer(this.native, buffer)
    }

    setMask(enabled) {
        if (this.isMask == enabled) return

        this.isMask = enabled
        this.enabled && globalThis.updateMaterial(this.node.id(), this.isMask, true)
    }

    onEnableChanged(enabled) {
        globalThis.updateMaterial(this.node.id(), this.isMask, enabled)
    }

    createData(image) {
        let left = 0
        let right = 1
        let top = 1
        let bottom = 0

        let array = [
            0, 0, left, bottom,     //0
            0, 0, right, bottom,    //1
            0, 0, left, top,        //2
            0, 0, right, top,       //3
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

class SpriteSliced extends SpriteSimple {
    // constructor is called before the below assignment
    // so we need to rem them
    // top = 0
    // bottom = 0
    // left = 0
    // right = 0

    createData(image) {
        this.top = image.top
        this.bottom = image.bottom
        this.left = image.left
        this.right = image.right

        let left = 0
        let right = 1
        let top = 1
        let bottom = 0

        let width = image.width
        let height = image.height

        let bleft = this.left / width
        let bright = 1. - this.right / width
        let btop = 1. - this.top / height
        let bbottom = this.bottom / height

        let array = [
            0, 0, left, btop,  //0
            0, 0, bleft, btop,  //1
            0, 0, left, top,  //2
            0, 0, bleft, top,  //3
            0, 0, bright, btop,  //4
            0, 0, right, btop,  //5
            0, 0, bright, top,  //6
            0, 0, right, top,  //7
            0, 0, left, bottom,  //8
            0, 0, bleft, bottom,  //9
            0, 0, left, bbottom,  //10
            0, 0, bleft, bbottom,  //11
            0, 0, bright, bottom,  //12
            0, 0, right, bottom,  //13
            0, 0, bright, bbottom,  //14
            0, 0, right, bbottom,  //15
        ]
        return new Float32Array(array)
    }

    fillBuffer(bound) {
        let top = this.top
        let bottom = this.bottom
        let left = this.left
        let right = this.right
        let size = bound.size
        let height = top + bottom
        let width = left + right

        if (width > size.x || height > size.y) {
            let pivot = bound.pivot
            bound.setSize(Math.max(size.x, width), Math.max(size.y, height), pivot.x, pivot.y)
            return
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

class Button extends Component {
    target = null
    scale = 0

    constructor(node) {
        super(node)

        this.target = node.getComponent(BoundBox2D)
    }

    check(x, y, state) {
        this.node.updateWorld()

        if (this.target.checkInside(x, y)) {
            if (state == 0) this.scale = .9
            if (state == 3) this.scale = 1

            return true
        }
    }

    update(dt) {
        let s0 = this.scale
        if (s0 == 0) return

        let scale = this.node.scale
        let s1 = scale.x
        s1 += Math.sign(s0 - s1) * dt
        if (Math.abs(s0 - s1) < .001) {
            s1 = s0
            this.scale = 0
        }

        scale.x = s1
        scale.y = s1

        this.node.isDirty = true
    }
}

class Toggle extends Component {
    // target = null
    // checkmark = null
    scale = 0

    // isChecked = true

    constructor(node) {
        super(node)

        this.target = node.getComponent(BoundBox2D)
        this.checkmark = node.children[0]

        this.isChecked = this.checkmark.active
    }

    check(x, y, state) {
        this.node.updateWorld()

        if (this.target.checkInside(x, y)) {
            if (state == 0) this.scale = .9
            if (state == 3) this.scale = 1

            return true
        }
    }

    update(dt) {
        let s0 = this.scale
        if (s0 == 0) return

        let scale = this.node.scale
        let s1 = scale.x
        s1 += Math.sign(s0 - s1) * dt
        if (Math.abs(s0 - s1) < .001) {
            s1 = s0
            this.scale = 0

            if(s0 == 1) {
                this.isChecked = !this.isChecked
                this.checkmark.setActive(this.isChecked)
            }
        }

        scale.x = s1
        scale.y = s1

        this.node.isDirty = true
    }
}

class ProgressBar extends Component {
    value = 0
    background = null
    fill = null

    constructor(node) {
        super(node)
        this.background = node.getComponent(BoundBox2D)

        let fill = node.children[0].getComponent(BoundBox2D)
        fill.pivot.set(0, .5)
        fill.setAlignment(0, -1, 0, 0, 0, 0)

        this.fill = fill
        this.value = fill.size.x / this.background.size.x
    }

    set(value) {
        this.value = Math.max(Math.min(value, 1.), 0.)

        let fill = this.fill
        let width = this.background.size.x * this.value
        fill.setSize(width, fill.size.y, fill.pivot.x, fill.pivot.y)
    }

    get() { return this.value }
}

let root = new Node
let camera = null
let designWidth = 640
let designHeight = 960
let textures = {
    // tiny: {
    //     width: 2,
    //     height: 2,
    //     native: null
    // },
    // red: {
    //     width: 2,
    //     height: 2,
    //     native: null
    // },
    progress_bg: {
        width: 510,
        height: 32,
        native: null,
        top: 0,
        bottom: 0,
        left: 20,
        right: 20
    },
    progress_fill: {
        width: 56,
        height: 28,
        native: null,
        top: 0,
        bottom: 0,
        left: 15,
        right: 15
    }
}

var init = function () {
    beginScene()

    for (let i in textures) {
        textures[i].native = globalThis.loadImage(i + '.ktx2')
    }

    new BoundBox2D(root, new Vec2(designWidth, designHeight), new Vec2(.5, .5))

    let node = root.addChild()
    node.position.z = 1
    camera = new Camera(node)

    for (let i = 0; i < 20; i++) {
        node = root.addChild()
        new SpriteSliced(node, textures.progress_bg, 200, 28)
        node.getComponent(BoundBox2D).setAlignment(1, -1, 50 * (i + 1), 0, 30, 0)

        let child = node.addChild()
        new SpriteSliced(child, textures.progress_fill, 200, 28)

        new ProgressBar(node).set(i * .02)

        new Button(node)
    }

    node = root.addChild()
    new SpriteSliced(node, textures.progress_bg, 50, 28)
    node.getComponent(BoundBox2D).setAlignment(1, 1, 50, 0, 0, 50)

    let child = node.addChild()
    new SpriteSliced(child, textures.progress_fill, 50, 28)

    new Toggle(node)
}

var input = {
    x: 0, y: 0,
    prevX: 0, prevY: 0,
    state: 3, prevState: 3,
    stack: 0,
    scale: 1
}

var resizeView = function (width, height) {
    let fit_width = width < height
    let aspect = width / height
    let ZOOM = fit_width ? designWidth : designHeight
    input.scale = ZOOM / (fit_width ? width : height)

    width = fit_width ? ZOOM : (ZOOM * aspect)
    height = fit_width ? (ZOOM / aspect) : ZOOM
    globalThis.updateCamera(camera.node.id(), width, height)

    let bound = root.getComponent(BoundBox2D)
    bound.setSize(width, height, .5, .5)
}

var transformBuffer = null
var bufferLength = 0

var sendUpdateTransform = function (list) {
    const SEGMENT = 10
    let length = list.length * SEGMENT
    if (bufferLength != length) {
        transformBuffer = new Float32Array(length)
        bufferLength = length
    }

    let offset = 0
    for (let i of list) {
        transformBuffer.set(i.toArray(), offset)
        offset += SEGMENT

        i.isDirty = false
    }

    globalThis.updateTransforms(transformBuffer)
}

var t = 0

var checkInput = function (list) {
    let state = input.state
    let prevState = input.prevState

    input.stack = state == prevState ? (input.stack + 1) : 0
    input.prevState = input.state

    if (state == 3 && prevState == 3) return // no input

    let isHold = state == 0 && prevState == 0
    let isTap = state == 0 && prevState != 0
    let isClick = state == 3 && prevState == 0

    let x = input.x * input.scale
    let y = input.y * input.scale

    for (let i of list) {
        if (i.check(x, y, state)) {
            break
        }
    }
}

var update = function (dt) {
    let a = [root]
    let interactables = []
    t += dt * 100

    let id = 0
    while (id < a.length) {
        let children = a[id++].children
        for (let i of children) {
            if (!i.active) continue

            for (let c of i.components) {
                c.enabled && c.update && c.update(dt)
                c.enabled && ((c instanceof Button) || (c instanceof Toggle)) && interactables.push(c)
            }

            a.push(i)
        }
    }

    // let target0 = root.children[2].children[0]
    // target0.rotation.z += .01
    for (let i = 1; i < root.children.length - 1; i++) {
        let progressBar = root.children[i].getComponent(ProgressBar)
        let c = progressBar.get() + dt
        progressBar.set(c - Math.floor(c))
    }

    // a.push(target0)
    a = a.filter(i => { return i.isDirty })
    a.length > 0 && sendUpdateTransform(a)

    checkInput(interactables)
}

init()
