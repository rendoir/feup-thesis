const THREE = require('three');
const Frame = require('./frame');
const { Object, ObjectState } = require('./object');
const { Translation, Orientation, Scale, Immutability, Unknown, Multiple, Rotation } = require('./transformation');

class Loader {
    static LoadFramesDemo1(storyboard) {
        const frames = require('./demos/demo1');
        storyboard.setFrames(frames);
    }

    static LoadRealTest1(storyboard) {
        const json = require('./demos/test1.json');
        let frames = Loader.ParseJson(json);
        storyboard.setFrames(frames);
    }

    static ParseJson(json) {
        let frames = [];
        //console.log(json);
        json.forEach(jsonFrame => {
            let transformation = Loader.ParseEvents(jsonFrame.events);
            let object = Loader.ParsePhenomena(jsonFrame.phenomena);
            let initialTimestamp = object.states[0].timestamp;
            let finalTimestamp = object.states[object.states.length-1].timestamp;
            let frame = new Frame(object, transformation, initialTimestamp, finalTimestamp);
            frames.push(frame);
            //console.log(frame);
        });
        return frames;
    }

    /** Parse events into a transformation */
    static ParseEvents(events) {
        let transformations = [];

        events.forEach(event => {
            switch (event.type) {
                case "TRANSLATION":
                    transformations.push(new Translation(new THREE.Vector2(event.triggerValue, event.triggerValue))); // TODO: Update when it's a vector
                    break;

                case "UNIFORM_SCALE":
                    transformations.push(new Scale(new THREE.Vector2(event.triggerValue, event.triggerValue))); // TODO: Update when it's a vector
                    break;

                case "ROTATION":
                    transformations.push(new Orientation(event.triggerValue));
                    break;
            
                default:
                    break;
            }
        });

        // If there are more than one transformation, return multiple
        let transformation;
        if( transformations.length > 1 )
            transformation = new Multiple(transformations);
        else transformation = transformations[0];

        return transformation;
    }

    /** Parse phenomena into an object */
    static ParsePhenomena(phenomena) {
        let object = new Object();
        let objectStates = [];

        phenomena.forEach(phenomenon => {
            let vertices = [];

            phenomenon.representation.forEach(vertex => {
                vertices.push(new THREE.Vector2(vertex[0], vertex[1]));
            });

            objectStates.push(new ObjectState(phenomenon.timestamp, vertices));
        });

        object.setStates(objectStates);
        return object;
    }

}

module.exports = Loader;
