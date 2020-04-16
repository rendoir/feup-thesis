const THREE = require('three');
const Frame = require('./frame');
const { Object, ObjectState } = require('./object');
const { Translation, Orientation, Scale, Immutability, Unknown, Multiple, Rotation } = require('./transformation');
const axios = require('axios');

const SERVER_URL = "http://127.0.0.1:8080";

class Loader {
    static LoadFramesDemo1(storyboard) {
        const frames = require('./demos/demo1');
        storyboard.setFrames(frames);
    }

    static LoadRealTest1(storyboard) {
        let frames = Loader.ParseRealTest1();
        storyboard.setFrames(frames);
    }

    static ParseRealTest1() {
        const json = require('./demos/test1.json');
        return Loader.ParseJson(json);
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

    /** Send request to server */
    static SendRequest() {
        axios({
            method: 'post',
            headers: {'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Origin': '*'},
            url: SERVER_URL + '/storyboard/3',
            data: {
                parameters: {
                    "translation": {
                        "delta": 1,
                        "directedAcc": 3, 
                        "absoluteAcc": 10
                    },
                    "rotation": {
                        "delta": 0.05,
                        "directedAcc": 0.3, 
                        "absoluteAcc": 45
                    },
                    "scale": {
                        "delta": 0.1,
                        "directedAcc": 0.3
                    }
                }
            }
          })
          .then(function (response) {
              console.log(response);
          })
          .catch(function (error) {
              console.log(error);
          });
    }
}

module.exports = Loader;
