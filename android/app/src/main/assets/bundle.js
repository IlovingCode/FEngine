// test

class Vec4 {
    // x = 0; y = 0; z = 0; w = 1

    constructor(x, y, z, w = 1) { this.set(x, y, z, w) }

    set(x, y, z, w) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w ?? this.w
    }

    copy(target) { this.set(target.x, target.y, target.z, target.w) }

    clone() { return new Vec4(this.x, this.y, this.z, this.w) }

    static ONE = new Vec4(1, 1, 1, 1)
    static ZERO = new Vec4(0, 0, 0, 0)
}

class Vec3 {
    // x = 0; y = 0; z = 0

    constructor(x, y, z = 0) { this.set(x, y, z) }

    set(x, y, z) {
        this.x = x
        this.y = y
        this.z = z ?? this.z
    }

    copy(target) { this.set(target.x, target.y, target.z) }

    clone() { return new Vec3(this.x, this.y, this.z) }

    static ONE = new Vec3(1, 1, 1)
    static ZERO = new Vec3(0, 0, 0)
}

class Vec2 {
    // x = 0; y = 0

    constructor(x, y) { this.set(x, y) }

    set(x, y) {
        this.x = x
        this.y = y
    }

    copy(target) { this.set(target.x, target.y) }

    clone() { return new Vec2(this.x, this.y) }

    static ONE = new Vec2(1, 1)
    static ZERO = new Vec2(0, 0)
}

class Node {
    worldPosition = new Vec3(0, 0, 0)

    position = new Vec3(0, 0, .01)
    rotation = new Vec3(0, 0, 0)
    scale = new Vec3(1, 1, 1)
    parent = null
    children = []
    components = []
    native = new Float32Array(10)
    isDirty = true
    isUpdated = false
    active = true
    globalActive = true

    constructor(id) { this.native[0] = id }

    id() { return this.native[0] }

    setActive(enabled) {
        if (this.active == enabled) return

        this.active = enabled
        this.onActive(this.parent.globalActive && enabled)
    }

    onActive(enabled) {
        if (this.globalActive == enabled) return
        this.globalActive = enabled

        for (let i of this.components) i.enabled && i.onEnableChanged && i.onEnableChanged(enabled)

        for (let i of this.children) i.active && i.onActive(enabled)
    }

    addChild() {
        let scene = this
        while (scene.id() >= 0) scene = scene.parent

        let id = globalThis.createEntity(scene.nativeScene, this.id())
        let node = new Node(id)

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

    onDirty() {
        this.isDirty = false
        this.isUpdated = true
        for (let i of this.children) i.onDirty()
    }

    updateWorld() {
        let worldPos = this.worldPosition

        if (this.isUpdated) {
            let worldTransform = globalThis.getWorldTransform(this.native)

            worldPos.x = worldTransform[1]
            worldPos.y = worldTransform[2]
            worldPos.z = worldTransform[3]

            this.isUpdated = false
        }

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

class Scene extends Node {
    nativeScene = null
    camera = null

    constructor() {
        super(-1)

        this.nativeScene = globalThis.beginScene()
    }

    onResizeView(width, height) {
        let fit_width = width * designHeight < height * designWidth
        let aspect = width / height
        let ZOOM = fit_width ? designWidth : designHeight
        input.scale = ZOOM / (fit_width ? width : height)

        width = fit_width ? ZOOM : Math.round(ZOOM * aspect)
        height = fit_width ? Math.round(ZOOM / aspect) : ZOOM
        globalThis.updateCamera(this.getCameraNative(), width, height)

        let bound = this.getComponent(BoundBox2D)
        bound.updateSize(width, height)
        bound.alignChildren()
    }

    getCameraNative() { return this.camera.node.id() }
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

        let width = size.x
        let height = size.y

        this.left = -width * pivot.x
        this.right = width + this.left
        this.bottom = -height * pivot.y
        this.top = height + this.bottom
    }

    checkInside(x, y) {
        let pos = this.node.worldPosition
        x -= pos.x
        y -= pos.y

        return x < this.right && x > this.left
            && y < this.top && y > this.bottom
    }

    updateAlignment() {
        let horizontal = this.horizontalAlign
        let vertical = this.verticalAlign

        let node = this.node
        let parent = node.parent.getComponent(BoundBox2D)
        let pWidth = parent.size.x
        let pHeight = parent.size.y
        let width = this.size.x
        let height = this.size.y

        switch (horizontal) {
            case 0:
                break
            case 1:
                this._left = pWidth - (width + this._right)
                break
            case -1:
                this._right = pWidth - (width + this._left)
                break
            default:
                width = pWidth - (this._left + this._right)
        }

        switch (vertical) {
            case 0:
                break
            case 1:
                this._bottom = pHeight - (height + this._top)
                break
            case -1:
                this._top = pHeight - (height + this._bottom)
                break
            default:
                height = pHeight - (this._bottom + this._top)
        }

        this.updateSize(width, height) && this.alignChildren()

        let pos = node.position
        if (horizontal != 0) {
            pos.x = (parent.left + this._left) - this.left
            node.isDirty = true
        }

        if (vertical != 0) {
            pos.y = (parent.bottom + this._bottom) - this.bottom
            node.isDirty = true
        }
    }

    updateSize(width, height) {
        let size = this.size
        let pivot = this.pivot
        let hasChanged = false

        if (width != size.x) {
            this.left = -width * pivot.x
            this.right = width + this.left
            size.x = width

            hasChanged = true
        }

        if (height != size.y) {
            this.bottom = -height * pivot.y
            this.top = height + this.bottom
            size.y = height

            hasChanged = true
        }

        if (!hasChanged) return

        let cb = this.onBoundChanged
        cb && cb(this)

        return true
    }

    alignChildren() {
        let children = this.node.children
        for (let i of children) {
            i.getComponent(BoundBox2D)?.updateAlignment()
        }
    }

    setAlignment(vertical, horizontal, top, bottom, left, right) {
        this.horizontalAlign = horizontal
        this.verticalAlign = vertical
        this._top = top
        this._bottom = bottom
        this._left = left
        this._right = right

        this.updateAlignment()
    }

    setSize(width, height) {
        let size = this.size
        if (this.horizontalAlign > 1) width = size.x
        if (this.verticalAlign > 1) height = size.y

        if (this.updateSize(width, height)) {
            this.updateAlignment()
            this.alignChildren()
        }
    }

    setPivot(x, y) {
        let size = this.size
        let pivot = this.pivot
        let hasChanged = false

        if (x != pivot.x) {
            this.left = -size.x * x
            this.right = size.x + this.left
            pivot.x = x

            hasChanged = true
        }

        if (y != pivot.y) {
            this.bottom = -size.y * y
            this.top = size.y + this.bottom
            pivot.y = y

            hasChanged = true
        }

        if (!hasChanged) return

        let cb = this.onBoundChanged
        cb && cb(this)
        this.alignChildren()

        let node = this.node
        let parent = node.parent.getComponent(BoundBox2D)
        let pos = node.position
        pos.x = (parent.left + this._left) - this.left
        pos.y = (parent.bottom + this._bottom) - this.bottom
        node.isDirty = true
    }
}

const UI_LAYER = 0x1

class TextSimple extends Component {
    // vb = null
    // ib = null
    // native = null
    // textAlign = 0
    // font = null
    // size = 20
    string = null

    constructor(node, font, size, align = 0, max = 10) {
        super(node)

        let bound = node.getComponent(BoundBox2D)
        let width = size * 2
        let height = size
        if (!bound) bound = new BoundBox2D(node, new Vec2(width, height), new Vec2(.5, .5))
        else bound.setSize(width, height)

        bound.onBoundChanged = this.onBoundUpdated.bind(this)

        this.font = font
        this.size = size
        this.textAlign = align

        this.vb = new Float32Array(max * 16)

        let maskId = 0
        let parent = node.parent
        while (parent) {
            let sprite = parent.getComponent(SpriteSimple)
            if (sprite) {
                maskId = sprite.maskId
                break
            } else parent = parent.parent
        }

        this.native = globalThis.addText(this.node.id(), this.vb, this.font.native, maskId)
    }

    setColor(color) {
        globalThis.updateMaterial(this.node.id(), color.x, color.y, color.z, color.w)
    }

    setText(text) {
        if (this.string == text) return

        let bound = this.node.getComponent(BoundBox2D)

        this.string = text
        let { scale, ascent, descent, lineGap, data } = this.font

        scale = this.size / scale
        ascent *= scale
        descent *= scale
        lineGap *= scale

        let lines = text.split(/\r\n|\r|\n/g)
        let linesWidth = []
        let max = 0
        let x = 0
        let y = 0
        for (let l of lines) {
            // let words = l.trim().split(' ')
            l = l.trim()

            let width = 0
            for (let c of l) width += data[c].ax
            if (width > max) max = width

            y += ascent - descent + lineGap

            lines[linesWidth.length] = l
            linesWidth.push(width * scale)
        }

        max *= scale
        bound.setSize(max, y - lineGap)

        let vb = this.vb
        let count = 0
        let space = data[' '].ax * scale
        y = -bound.top

        for (let i = 0; i < lines.length; i++) {
            x = bound.left + this.textAlign * (max - linesWidth[i])

            for (let c of lines[i]) {
                if (c == ' ') {
                    x += space
                    continue
                }

                let glyph = data[c]

                let left = x + glyph.offsetX * scale
                let top = -y - ascent - glyph.offsetY * scale
                let right = left + glyph.width * scale
                let bottom = top - glyph.height * scale
                let u0 = glyph.u0
                let u1 = glyph.u1
                let v0 = glyph.v0
                let v1 = glyph.v1

                x += glyph.ax * scale

                let buffer = [
                    left, bottom, u0, v1,   //0
                    right, bottom, u1, v1,  //1
                    left, top, u0, v0,      //2
                    right, top, u1, v0      //3
                ]

                vb.set(buffer, count)
                count += 16
            }

            y += ascent - descent + lineGap
        }

        this.native = globalThis.updateRenderer(this.native, vb, count, this.node.id())
    }

    onBoundUpdated(bound) {
        // let buffer = this.fillBuffer(bound)
        // buffer && globalThis.updateRenderer(this.native, buffer)
    }

    onEnableChanged(enabled) {
        globalThis.updateMaterial(this.node.id(), enabled, UI_LAYER)
    }
}

class SpriteSimple extends Component {
    // vb = null
    // native = null
    // maskId = 0

    constructor(node, image, isMask = false) {
        super(node)

        let bound = node.getComponent(BoundBox2D)
        let width = image.width
        let height = image.height
        if (!bound) bound = new BoundBox2D(node, new Vec2(width, height), new Vec2(.5, .5))
        else bound.setSize(width, height)

        bound.onBoundChanged = this.onBoundUpdated.bind(this)

        let maskId = 0
        let parent = node.parent
        while (parent) {
            let sprite = parent.getComponent(SpriteSimple)
            if (sprite) {
                maskId = sprite.maskId
                break
            } else parent = parent.parent
        }

        if (isMask) maskId++

        this.maskId = maskId
        this.vb = this.createData(image)
        this.native = globalThis.addRenderer(node.id(), this.fillBuffer(bound), image.native, isMask, maskId)
    }

    onBoundUpdated(bound) {
        let buffer = this.fillBuffer(bound)
        buffer && globalThis.updateRenderer(this.native, buffer)
    }

    onEnableChanged(enabled) {
        globalThis.updateMaterial(this.node.id(), enabled, UI_LAYER)
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

    setSprite(image) {
        this.node.getComponent(BoundBox2D).setSize(image.width, image.height)
        globalThis.updateMaterial(this.node.id(), image.native)
    }
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
            bound.setSize(Math.max(size.x, width), Math.max(size.y, height))
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
}


class SpriteRadial extends SpriteSimple {
    // bias = [0, 0, 0, 0, 0, 0, 0, 0]

    createData(image) {
        let left = 0
        let right = 1
        let top = 1
        let bottom = 0
        let h2 = (left + right) * .5
        let v2 = (top + bottom) * .5

        this.bias = [0, 1, 0, 1, 0, 1, 0, 1]

        let array = [
            0, 0, left, bottom,     //0-0
            0, 0, left, bottom,     //1-0
            0, 0, h2, bottom,       //2-1
            0, 0, h2, bottom,       //3-1
            0, 0, right, bottom,    //4-2
            0, 0, right, bottom,    //5-2
            0, 0, left, v2,         //6-3
            0, 0, left, v2,         //7-3
            0, 0, h2, v2,           //8-4
            0, 0, right, v2,        //9-5
            0, 0, right, v2,        //10-5
            0, 0, left, top,        //11-6
            0, 0, left, top,        //12-6
            0, 0, h2, top,          //13-7
            0, 0, h2, top,          //14-7
            0, 0, right, top,       //15-8
            0, 0, right, top,       //16-8
        ]
        return new Float32Array(array)
    }

    fillBuffer(bound) {
        let top = bound.top
        let bottom = bound.bottom
        let left = bound.left
        let right = bound.right
        let bias = this.bias

        let vb = this.vb
        //map = [56, 61, 37, 16, 8, 1, 29, 48]
        // 6 7 8
        // 3 4 5
        // 0 1 2 

        vb[0] = left, vb[1] = bias[5] * left
        vb[4] = left, vb[5] = bottom
        vb[8] = bias[4] * bottom, vb[9] = bottom
        vb[12] = 0, vb[13] = bottom
        vb[16] = bias[3] * -bottom, vb[17] = bottom
        vb[20] = right, vb[21] = bottom
        vb[24] = left//, vb[25] = 0
        vb[28] = left, vb[29] = bias[6] * -left
        // vb[32] = 0, vb[33] = 0
        vb[36] = right, vb[37] = bias[2] * -right
        vb[40] = right//, vb[41] = 0
        vb[44] = left, vb[45] = top
        vb[48] = bias[7] * -top, vb[49] = top
        vb[52] = 0, vb[53] = top
        vb[56] = bias[0] * top, vb[57] = top
        vb[60] = right, vb[61] = bias[1] * right
        vb[64] = right, vb[65] = top

        return vb
    }

    setAngle(angle) {
        let count = Math.floor(angle / (Math.PI / 4))
        angle -= count * (Math.PI / 4)
        let bias = this.bias

        for (let i = 0; i < bias.length; i++) {
            let num = i % 2

            if (count == i) {
                bias[i] = num == 0 ? Math.tan(angle) : Math.tan(Math.PI / 4 - angle)
                // bias[i] = count > i ? (1 - num) : num
            } else bias[i] = count > i ? (1 - num) : num
        }
    }
}

class Button extends Component {
    // target = null
    scale = 0

    constructor(node) {
        super(node)

        this.target = node.getComponent(BoundBox2D)
    }

    check(x, y, state) {
        if (this.target.checkInside(x, y)) {
            if (state == 0) this.scale = .9
            if (state == 3) this.scale = 1

            return true
        } else if (this.scale > 0) {
            this.scale = -1
        }
    }

    update(dt) {
        let s0 = Math.abs(this.scale)
        if (s0 == 0) return

        let scale = this.node.scale
        let s1 = scale.x
        s1 += Math.sign(s0 - s1) * dt
        if (Math.abs(s0 - s1) < .01) {
            s1 = s0
            this.scale == 1 && this.onClick()
            s0 == 1 && (this.scale = 0)
        }

        scale.x = s1
        scale.y = s1

        this.node.isDirty = true
    }

    onClick() { }
}

class Toggle extends Button {
    // checkmark = null
    // isChecked = true

    constructor(node) {
        super(node)

        this.checkmark = node.children[0]
        this.isChecked = this.checkmark.active
    }

    onClick() {
        this.isChecked = !this.isChecked
        this.checkmark.setActive(this.isChecked)
    }
}

class ScrollView extends Component {
    // target = null
    // content = null

    deltaX = 0
    deltaY = 0
    scale = 0

    constructor(node) {
        super(node)

        this.target = node.getComponent(BoundBox2D)
        node.children.length && this.setContent(node.children[0])
    }

    setContent(node) {
        let content = node.getComponent(BoundBox2D)
        node.position.y = this.target.top
        node.isDirty = true

        this.content = content
    }

    check(x, y, state) {
        if (this.target.checkInside(x, y)) {
            if (state == 3) this.scale = -1
            if (state == 1) this.scale = 1

            this.deltaX = x - globalThis.input.prevX
            this.deltaY = y - globalThis.input.prevY

            // return true
        } else if (this.scale > 0) {
            this.scale = -1
        }
    }

    update(dt) {
        let s = Math.abs(this.scale)
        if (s == 0) return

        let content = this.content
        let target = this.target
        let min = target.top
        let max = target.top + (content.size.y - target.size.y)

        let pos = content.node.position
        pos.y += this.deltaY * s

        if (pos.y < min) pos.y = min
        if (pos.y > max) pos.y = max

        content.node.isDirty = true

        if (this.scale < 0) {
            s -= dt
            if (s < 0) this.scale = 0
            else this.scale = -s
        }
    }
}

class Layout extends Component {
    // left = 0
    // right = 0
    // top = 0
    // bottom = 0
    // spaceX = 0
    // spaceY = 0

    lastCount = 0

    constructor(node, left, right, top, bottom, spaceX, spaceY) {
        super(node)

        this.left = left
        this.right = right
        this.top = top
        this.bottom = bottom
        this.spaceX = spaceX
        this.spaceY = spaceY

        let bound = node.getComponent(BoundBox2D)
        bound.alignChildren = () => { }

        if (!bound) bound = new BoundBox2D(node, new Vec2(100, 100), new Vec2(.5, 1))
        else bound.setPivot(bound.pivot.x, 1)
    }

    forceUpdate() {
        this.lastCount = 0
        this.update(0)
    }

    update(dt) {
        let children = this.node.children
        if (this.lastCount == children.length) return

        this.lastCount = children.length

        let left = this.left
        let right = this.right
        let top = this.top
        let bottom = this.bottom
        let spaceX = this.spaceX
        let spaceY = this.spaceY

        // Vertical Container
        let pBound = this.node.getComponent(BoundBox2D)
        let tx = pBound.left + left
        let ty = pBound.top - top
        let maxInRow = 0
        for (let i of children) {
            let bound = i.getComponent(BoundBox2D)
            let t = tx + bound.size.x

            if (maxInRow < bound.size.y) maxInRow = bound.size.y

            if (t + right > pBound.right) {
                tx = pBound.left + left
                t = tx + bound.size.x
                ty -= maxInRow + spaceY
            }

            let x = tx - bound.left
            let y = ty - bound.top

            tx = t + spaceX

            i.position.set(x, y)
            i.isDirty = true
        }

        pBound.setSize(pBound.size.x, pBound.top - (ty - maxInRow - bottom))
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
        fill.setSize(width, fill.size.y)
    }

    get() { return this.value }
}

class ProgressCircle extends Component {
    value = 1
    background = null
    fill = null

    constructor(node) {
        super(node)
        this.background = node.getComponent(BoundBox2D)
        let fill = node.children[0].getComponent(BoundBox2D)

        this.fill = fill
    }

    set(value) {
        this.value = Math.max(Math.min(value, 1.), 0.)

        let fill = this.fill
        let width = this.background.size.x * this.value
        fill.setSize(width, fill.size.y)
    }

    get() { return this.value }
}

var buildFont = function (font) {
    let text = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890qwertyuiopasdfghjklzxcvbnm!@#$%^&*()-=[];',./_+{}:\"<>?\\|`~ "
    let buffer = new Int16Array(text.length * 7 + 4)

    font.native = globalThis.renderText(font.name, text, buffer, font.width, font.height, font.scale)
    font.ascent = buffer[0]
    font.descent = buffer[1]
    font.lineGap = buffer[2]

    let count = 3
    for (let i of text) {
        let ax = buffer[count + 0]
        let offsetX = buffer[count + 1]
        let offsetY = buffer[count + 2]
        let width = buffer[count + 3]
        let height = buffer[count + 4]
        let u0 = buffer[count + 5] / font.width
        let v0 = 1 - buffer[count + 6] / font.height
        let u1 = u0 + width / font.width
        let v1 = v0 - height / font.height

        font.data[i] = { ax, offsetX, offsetY, width, height, u0, v0, u1, v1 }
        count += 7
    }
}

var transformBuffer = null
var bufferLength = 0
var input = {
    x: 0, y: 0,
    prevX: 0, prevY: 0,
    state: 3, prevState: 3,
    stack: 0, scale: 1
}

var resizeView = function (width, height) {
    uiRoot.onResizeView(width, height)
}

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

        i.onDirty()
    }

    globalThis.updateTransforms(transformBuffer)
}

var checkInput = function (list) {
    let { state, prevState, scale, x, y } = input

    input.stack = state == prevState ? (input.stack + 1) : 0
    input.prevState = input.state

    if (state == 3 && prevState == 3) return // no input

    // let isHold = state == 0 && prevState == 0
    let isTap = state == 0 && prevState != 0
    // let isClick = state == 3 && prevState == 0

    x *= scale
    y *= scale

    if (isTap) {
        input.prevX = x
        input.prevY = y
    }

    for (let i of list) {
        i.node.updateWorld()
        if (i.check(x, y, state)) {
            break
        }
    }

    input.prevX = x
    input.prevY = y
}

var update = function (dt) {
    let a = [uiRoot]
    let interactables = []

    let id = 0
    while (id < a.length) {
        let children = a[id++].children
        for (let i of children) {
            if (!i.active) continue

            for (let c of i.components) {
                if (!c.enabled) continue
                c.update && c.update(dt)

                if ((c instanceof Button)
                    || (c instanceof Toggle)
                    || (c instanceof ScrollView))
                    interactables.push(c)
            }

            a.push(i)
        }
    }

    a = a.filter(i => { return i.isDirty })
    a.length > 0 && sendUpdateTransform(a)

    checkInput(interactables)

    globalThis.render(uiRoot.nativeScene, uiRoot.getCameraNative())
}
