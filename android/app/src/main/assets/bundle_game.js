const gameRoot = new Scene

class GameController extends Component {
    timer = 0

    constructor(node) {
        super(node)
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

    
}();