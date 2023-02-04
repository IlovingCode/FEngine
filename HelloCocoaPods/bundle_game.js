
const designWidth = 640
const designHeight = 960

const textures = {
    tiny: {
        width: 2,
        height: 2,
        native: null
    },
    red: {
        width: 2,
        height: 2,
        native: null
    },
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

const font = {
    name: 'cmunrm.ttf',
    width: 256,
    height: 256,
    scale: 38,
    native: null,
    ascent: 0,
    descent: 0,
    lineGap: 0,
    data: {}
}

class Game extends Component {
    timer = 0

    constructor(node) {
        super(node)
    }

    update(dt) {
        this.timer += dt

        for (let i = 2; i < 4; i++) {
            let progressBar = root.children[i].getComponent(ProgressBar)
            let c = progressBar.get() + dt
            progressBar.set(c - Math.floor(c))
        }

        // globalThis.log(root.children.length)
        let radial = root.children[6].getComponent(SpriteRadial)
        radial.setAngle(this.timer % (Math.PI * 2))
        radial.onBoundUpdated(radial.node.getComponent(BoundBox2D))
    }
}

var init = function () {
    beginScene()

    for (let i in textures) {
        textures[i].native = loadImage(i + '.ktx2')
    }

    buildFont(font)

    new BoundBox2D(root, new Vec2(designWidth, designHeight), new Vec2(.5, .5))

    let node = root.addChild()
    new SpriteSimple(node, textures.tiny, true)
    node.getComponent(BoundBox2D).setSize(2000, 2000)
    new Game(node)

    node = root.addChild()
    node.position.z = 1
    camera = new Camera(node)

    for (let i = 0; i < 2; i++) {
        node = root.addChild()
        new SpriteSliced(node, textures.progress_bg)
        node.getComponent(BoundBox2D).setSize(200, 28)
        node.getComponent(BoundBox2D).setAlignment(1, -1, 50 * (i + 1), 0, 30, 0)

        let child = node.addChild()
        new SpriteSliced(child, textures.progress_fill)
        child.getComponent(BoundBox2D).setSize(200, 28)

        new ProgressBar(node).set(i * .2)

        new Button(node)
    }

    node = root.addChild()
    new SpriteSliced(node, textures.progress_bg)
    node.getComponent(BoundBox2D).setSize(50, 28)
    node.getComponent(BoundBox2D).setAlignment(1, 1, 50, 0, 0, 50)

    let child = node.addChild()
    new SpriteSliced(child, textures.progress_fill)
    child.getComponent(BoundBox2D).setSize(50, 28)

    new Toggle(node)

    node = root.addChild()
    new SpriteSimple(node, textures.tiny).setEnable(false)
    node.getComponent(BoundBox2D).setSize(300, 300)
    node.getComponent(BoundBox2D).setAlignment(0, -1, 0, 0, 10, 0)

    node = node.addChild()
    node.position.z = -.2
    new SpriteSimple(node, textures.tiny, true)
    node.getComponent(BoundBox2D).setSize(250, 250)
    let scrollView = new ScrollView(node)

    node = node.addChild()
    new BoundBox2D(node, new Vec2(250, 100), new Vec2(.5, .5))
    new Layout(node, 10, 10, 10, 10, 10, 10)

    scrollView.setContent(node)

    let content = 'QqWwEeRrTtYyUuIiOoPpAaSsDdFfGgHhJjKkLlZzXxCcVvBbNnMm'

    for (let i = 0; i < 200; i++) {
        child = node.addChild()

        new SpriteSimple(child, textures.red)
        child.getComponent(BoundBox2D).setSize(50, 50)
        new Button(child)

        let child1 = child.addChild()
        child1.position.set(0, 10, .1)
        new TextSimple(child1, font, 20, .5, 3).setText(i.toString())

        child1 = child.addChild()
        child1.position.set(0, -10, .1)
        let id = i % (content.length - 3)
        new TextSimple(child1, font, 25, 0.5, 3).setText(content.substring(id, id + 3))
    }

    node = root.addChild()
    node.position.set(0, 250, 0)
    new SpriteRadial(node, textures.red)
    node.getComponent(BoundBox2D).setSize(50, 50)

    node = root.addChild()
    node.position.set(0, -300, 0)
    let text = new TextSimple(node, font, 30, 0, 60)
    text.setText(
        `This is simple text.
        Merry Christmas!! Happy New Year!!`)
    text.setColor(1, 0, 0, 1)

    new Button(node)

    node = root.addChild()
    new SpriteSimple(node, font)
    node.getComponent(BoundBox2D).setSize(300, 300)
    node.getComponent(BoundBox2D).setAlignment(0, 1, 0, 0, 0, 10)
}

init()