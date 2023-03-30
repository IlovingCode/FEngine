const gameRoot = new Scene

gameRoot.textures = {
    bg0: {
        width: 1024,
        height: 768,
        native: null
    },
    bg1: {
        width: 1024,
        height: 768,
        native: null
    },
    bg2: {
        width: 1024,
        height: 768,
        native: null
    },
    bg3: {
        width: 1024,
        height: 768,
        native: null
    },
}

class GameController extends Component {
    constructor(node, textures) {
        super(node)

        this.timer = 0
        this.origin = Vec2.ZERO.clone()
        this.dir = Vec2.ZERO.clone()
        gameRoot.interactables.push(this)

        let { bg0, bg1, bg2, bg3 } = textures

        let y = 0
        let child = node.addChild()
        child.position.y = y
        new BoundBox2D(child, new Vec2(bg0.width, bg0.height), Vec2.ZERO.clone())
        new SpriteSimple(child, bg0)
        y += bg0.height

        child = node.addChild()
        child.position.y = y
        new BoundBox2D(child, new Vec2(bg1.width, bg1.height), Vec2.ZERO.clone())
        new SpriteSimple(child, bg1)
        y += bg1.height

        child = node.addChild()
        child.position.y = y
        new BoundBox2D(child, new Vec2(bg2.width, bg2.height), Vec2.ZERO.clone())
        new SpriteSimple(child, bg2)
        y += bg2.height

        child = node.addChild()
        child.position.y = y
        new BoundBox2D(child, new Vec2(bg3.width, bg3.height), Vec2.ZERO.clone())
        new SpriteSimple(child, bg3)

        this.height = y + bg3.height
        this.width = bg0.width
    }

    clear() {
        for (let i of this.node.children) i.destroy()
        this.node.children.length = 0
    }

    check(x, y, state) {
        let origin = this.origin
        if (state == 0) {
            origin.set(x, y)
            return
        }

        this.onDirection(this.dir.set(x - origin.x, y - origin.y))
    }

    onDirection(dir) {
        let length = Math.min(Math.sqrt(dir.lengthSqr()), 5)
        if (length <= 0) return

        dir.normalize()

        let { width, height, scale } = gameRoot.camera
        let node = gameRoot.camera.node
        let pos = node.position
        pos.x += dir.x * length
        pos.y += dir.y * length

        width *= scale * .5
        height *= scale * .5

        if (pos.x < width) pos.x = width
        if (pos.y < height) pos.y = height

        width = this.width - width
        height = this.height - height
        if (pos.x > width) pos.x = width
        if (pos.y > height) pos.y = height

        node.isDirty = true
    }
}

void function init() {
    let { textures } = gameRoot.init()

    let node = gameRoot.addChild()
    let pos = node.position
    pos.z = 1
    pos.x = textures.bg0.width * .25
    pos.y = textures.bg0.height * .35
    new Camera(node).scale = .5

    node = gameRoot.addChild()
    new GameController(node, textures)
}();

