const gameRoot = new Scene

class GameController extends Component {
    constructor(node) {
        super(node)

        this.timer = 0
    }

    update(dt) {
    }
}

void function init() {
    let node = gameRoot.addChild()
    new GameController(node)

    node = gameRoot.addChild()
    node.position.z = 1
    gameRoot.camera = new Camera(node)

    // node = gameRoot.addChild
    // new SpriteSimple(node, textures.tiny)

}();

