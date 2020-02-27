/**
 * Class holds the states of an object through time in a frame
 * Each state has a timestamp and a set of vertices
 * Every two consecutive vertices form an edge
 */
class Object {
    constructor(states) {
        this.states = states;
        this.uid = Object.count;
        Object.count += 1;
    }
}

Object.count = 0;

class ObjectState {
    constructor(timestamp, vertices) {
        this.timestamp = timestamp;
        this.vertices = vertices;
    }
}

module.exports = {
    Object : Object,
    ObjectState : ObjectState
}