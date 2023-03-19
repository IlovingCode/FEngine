
const designWidth = 640
const designHeight = 960

const uiRoot = new Scene

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

class UIController extends Component {
    constructor(node) {
        super(node)

        this.timer = 0
    }

    update(dt) {
        this.timer += dt

        for (let i = 2; i < 4; i++) {
            let progressBar = uiRoot.children[i].getComponent(ProgressBar)
            let c = progressBar.get() + dt
            progressBar.set(c - Math.floor(c))
        }

        // globalThis.log(dt)
        let radial = uiRoot.children[6].getComponent(SpriteRadial)
        radial.setAngle(this.timer % (Math.PI * 2))
        radial.onBoundUpdated(radial.node.getComponent(BoundBox2D))

        let text = uiRoot.children[8].getComponent(TextSimple)
        text.setText(Math.floor(this.timer).toString())
    }
}

void function init() {

    for (let i in textures) {
        textures[i].native = loadImage(i + '.ktx2')
    }

    buildFont(font)

    let bound = new BoundBox2D(uiRoot, new Vec2(designWidth, designHeight), new Vec2(.5, .5))

    let node = uiRoot.addChild()
    // node.position.z = 0
    // new SpriteSimple(node, textures.tiny, true)
    // node.getComponent(BoundBox2D).setSize(2000, 2000)
    new UIController(node)

    node = uiRoot.addChild()
    node.position.z = 1
    uiRoot.camera = new Camera(node)

    for (let i = 0; i < 2; i++) {
        node = uiRoot.addChild()
        bound = new BoundBox2D(node, new Vec2(200, 28), new Vec2(.5, .5))
        new SpriteSliced(node, textures.progress_bg)
        bound.setAlignment(1, -1, 50 * (i + 1), 0, 30, 0)

        let child = node.addChild()
        bound = new BoundBox2D(child, new Vec2(200, 28), new Vec2(.5, .5))
        new SpriteSliced(child, textures.progress_fill)

        new ProgressBar(node).set(i * .2)
        new Button(node)
    }

    node = uiRoot.addChild()
    bound = new BoundBox2D(node, new Vec2(50, 28), new Vec2(.5, .5))
    new SpriteSliced(node, textures.progress_bg)
    bound.setAlignment(1, 1, 50, 0, 0, 50)

    let child = node.addChild()
    bound = new BoundBox2D(child, new Vec2(50, 28), new Vec2(.5, .5))
    new SpriteSliced(child, textures.progress_fill)

    new Toggle(node)

    node = uiRoot.addChild()
    bound = new BoundBox2D(node, new Vec2(300, 300), new Vec2(.5, .5))
    new SpriteSimple(node, textures.tiny)
    bound.setAlignment(0, -1, 0, 0, 10, 0)

    node = node.addChild()
    bound = new BoundBox2D(node, new Vec2(250, 250), new Vec2(.5, .5))
    new SpriteSimple(node, textures.tiny, true)
    let scrollView = new ScrollView(node)

    node = node.addChild()
    bound = new BoundBox2D(node, new Vec2(250, 100), new Vec2(.5, .5))
    new Layout(node, 10, 10, 10, 10, 10, 10)

    scrollView.setContent(node)

    let content = 'QqWwEeRrTtYyUuIiOoPpAaSsDdFfGgHhJjKkLlZzXxCcVvBbNnMm'

    for (let i = 0; i < 200; i++) {
        child = node.addChild()
        bound = new BoundBox2D(child, new Vec2(50, 50), new Vec2(.5, .5))
        new SpriteSimple(child, textures.red)
        new Button(child)

        let child1 = child.addChild()
        child1.position.set(0, 10)
        bound = new BoundBox2D(child1, new Vec2(100, 100), new Vec2(.5, .5))
        new TextSimple(child1, font, 20, .5, 3).setText((i + 1).toString())

        child1 = child.addChild()
        child1.position.set(0, -10)
        let id = i % (content.length - 3)
        bound = new BoundBox2D(child1, new Vec2(100, 100), new Vec2(.5, .5))
        new TextSimple(child1, font, 25, .5, 3).setText(content.substring(id, id + 3))
    }

    node = uiRoot.addChild()
    node.position.set(0, 250)
    bound = new BoundBox2D(node, new Vec2(50, 50), new Vec2(.5, .5))
    new SpriteRadial(node, textures.red)

    node = uiRoot.addChild()
    node.position.set(0, -300)
    bound = new BoundBox2D(node, new Vec2(100, 100), new Vec2(.5, .5))
    let str = `This is simple text.\n Merry Christmas!! Happy New Year!!`
    new TextSimple(node, font, 40, 0, str.length)
    .setText(str)
    .setColor(new Vec4(1, 0, 0, 1))
    new Button(node)

    node = uiRoot.addChild()
    node.position.set(0, -400)
    bound = new BoundBox2D(node, new Vec2(100, 100), new Vec2(.5, .5))
    new TextSimple(node, font, 40, 0, 9)
    .setText('0')
    .setColor(new Vec4(1, 1, 0, 1))
    bound.setAlignment(-1, 0, 0, 50, 0, 0)

    node = uiRoot.addChild()
    bound = new BoundBox2D(node, new Vec2(300, 300), new Vec2(.5, .5))
    new SpriteSimple(node, font)
    bound.setAlignment(0, 1, 0, 0, 0, 10)
}();
