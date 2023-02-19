
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
    scale: 43,
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

        // globalThis.log(dt)
        let radial = root.children[6].getComponent(SpriteRadial)
        radial.setAngle(this.timer % (Math.PI * 2))
        radial.onBoundUpdated(radial.node.getComponent(BoundBox2D))

        let text = root.children[8].getComponent(TextSimple)
        text.setText(Math.floor(this.timer).toString())
    }
}

void function init() {
    beginScene()

    for (let i in textures) {
        textures[i].native = loadImage(i + '.ktx2')
    }

    buildFont(font)

    root.position.z = 0
    new BoundBox2D(root, new Vec2(designWidth, designHeight), new Vec2(.5, .5))

    let node = root.addChild()
    // node.position.z = 0
    // new SpriteSimple(node, textures.tiny, true)
    // node.getComponent(BoundBox2D).setSize(2000, 2000)
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
    new SpriteSimple(node, textures.tiny)
    node.getComponent(BoundBox2D).setSize(300, 300)
    node.getComponent(BoundBox2D).setAlignment(0, -1, 0, 0, 10, 0)

    node = node.addChild()
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
        child1.position.set(0, 10)
        new TextSimple(child1, font, 20, .5, 3).setText((i + 1).toString())

        child1 = child.addChild()
        child1.position.set(0, -10)
        let id = i % (content.length - 3)
        new TextSimple(child1, font, 25, .5, 3).setText(content.substring(id, id + 3))
    }

    node = root.addChild()
    node.position.set(0, 250)
    new SpriteRadial(node, textures.red)
    node.getComponent(BoundBox2D).setSize(50, 50)

    node = root.addChild()
    node.position.set(0, -300)
    let str = `This is simple text.\n Merry Christmas!! Happy New Year!!`
    let text = new TextSimple(node, font, 40, 0, str.length)
    text.setText(str)
    text.setColor(1, 0, 0, 1)

    new Button(node)

    node = root.addChild()
    node.position.set(0, -400)
    text = new TextSimple(node, font, 40, 0, 9)
    text.setText('0')
    text.setColor(1, 1, 0, 1)

    node = root.addChild()
    new SpriteSimple(node, font)
    node.getComponent(BoundBox2D).setSize(300, 300)
    node.getComponent(BoundBox2D).setAlignment(0, 1, 0, 0, 0, 10)
}();