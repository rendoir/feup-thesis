/**
 * Abstract class for an object transformation in a frame
 */
class Transformation {
    constructor() { }

    static getName() { throw "Abstract method getName not implemented" }

    //getDetails() { throw "Abstract method getDetails not implemented" }
    //render(scene) { throw "Abstract method render not implemented" }
}

class Translation extends Transformation {
    constructor(translationVector) {
        super();
        this.translationVector = translationVector;
    }

    static getName() { return "Translation" }
}

module.exports = {
    Transformation : Transformation,
    Translation : Translation
}
