const THREE = require('three');
const axios = require('axios');

const Storyboard = require('./storyboard');
const Frame = require('./frame');
const { Object, ObjectState } = require('./object');
const { Translation, Orientation, Scale, Immutability, Unknown, Unimportant, Multiple } = require('./transformation');
const Settings = require('./settings');

const SERVER_URL = "http://fctmost.inesctec.pt:80/stfx/";
//const SERVER_URL = "http://127.0.0.1:80/stfx/";

//const APP_URL = "http://fctmost.inesctec.pt:8080";
const APP_URL = "http://127.0.0.1:8080";

class Loader {

    static LoadDataset() {
        // Get initial set of frames
        Loader.SendRequest((frames) => {
            Storyboard.instance.setFrames(frames);
        }, (error) => {
           console.error(error); 
        });

        // Get metadata
        Loader.HandleMetadataRequest();
    }

    static ParseJson(json) {
        let frames = [];
        //console.log(json);
        json.forEach(jsonFrame => {
            let transformation = Loader.ParseEvents(jsonFrame.events);
            let object = Loader.ParsePhenomena(jsonFrame.phenomena);
            let initialTimestamp = object.states[0].timestamp;
            let finalTimestamp = object.states[object.states.length-1].timestamp;
            if ( transformation !== undefined && object !== undefined ) {
                let frame = new Frame(object, transformation, initialTimestamp, finalTimestamp);
                frames.push(frame);
                //console.log(frame);
            }
        });
        return frames;
    }

    /** Parse events into a transformation */
    static ParseEvents(events) {
        let transformations = [];

        events.forEach(event => {
            switch (event.type) {
                case "TRANSLATION":
                    transformations.push(new Translation(new THREE.Vector2(event.trigger.transformation[0], event.trigger.transformation[1])));
                    break;

                case "UNIFORM_SCALE":
                    transformations.push(new Scale(new THREE.Vector2(event.trigger.transformation, event.trigger.transformation)));
                    break;

                case "ROTATION":
                    transformations.push(new Orientation(THREE.MathUtils.degToRad(event.trigger.transformation)));
                    break;

                case "UNIMPORTANT":
                    transformations.push(new Unimportant());
                    break;

                case "IMMUTABILITY":
                    transformations.push(new Immutability());
                    break;
            
                case "UNKNOWN":
                default:
                    transformations.push(new Unknown());
                    break;
            }
        });

        // If there are more than one transformation, return multiple
        let transformation;
        if( transformations.length > 1 )
            transformation = new Multiple(transformations);
        else if ( transformations.length > 0 ) 
            transformation = transformations[0];
        else transformation = new Unknown();

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
    static SendRequest(successCallback, errorCallback, depth = 0, initialTimestamp = null, finalTimestamp = null) {
        if ( Settings.instance.datasetKey === null ) return;
        
        let multiplier = {
            translation: Settings.instance.getSettingValue("s-translation-detail-multiplier") || 0,
            rotation: Settings.instance.getSettingValue("s-orientation-detail-multiplier") || 0,
            scale: Settings.instance.getSettingValue("s-scale-detail-multiplier") || 0,
            immutability: Settings.instance.getSettingValue("s-immutability-detail-multiplier") || 0
        };

        axios({
            method: 'post',
            headers: {'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Origin': '*'},
            url: SERVER_URL + '/storyboard/' + Settings.instance.datasetKey,
            params: {
                initialTimestamp: initialTimestamp,
                finalTimestamp: finalTimestamp
            },
            data: {
                parameters: {
                    translation: {
                        delta: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-translation-delta"), multiplier.translation, depth),
                        directedAcc: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-translation-relative"), multiplier.translation, depth), 
                        absoluteAcc: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-translation-absolute"), multiplier.translation, depth),
                        noiseEpsilon: Settings.instance.getSettingValue("s-translation-noise")
                    },
                    rotation: {
                        delta: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-orientation-delta"), multiplier.rotation, depth),
                        directedAcc: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-orientation-relative"), multiplier.rotation, depth), 
                        absoluteAcc: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-orientation-absolute"), multiplier.rotation, depth),
                        noiseEpsilon: Settings.instance.getSettingValue("s-orientation-noise")
                    },
                    scale: {
                        delta: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-scale-delta"), multiplier.scale, depth),
                        directedAcc: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-scale-relative"), multiplier.scale, depth), 
                        absoluteAcc: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-scale-absolute"), multiplier.scale, depth),
                        noiseEpsilon: Settings.instance.getSettingValue("s-scale-noise")
                    },
                    immutability: Loader.ApplyMultiplier(Settings.instance.getSettingValue("s-immutability-threshold"), multiplier.immutability, depth)
                }
            }
          })
          .then(function (response) {
              //console.log(response);
              let frames = Loader.ParseJson(response.data);
              successCallback(frames);
          })
          .catch(function (error) {
              //console.error(error);
              errorCallback(error);
          });
    }

    static ApplyMultiplier(value, mult, depth) {
        if ( isNaN(value) || value === null ) 
            return null;
        return value * Math.pow(mult, depth);
    }

    static HandleMetadataRequest() {
        if ( Settings.instance.datasetKey === null ) return;

        axios({
            method: 'get',
            headers: {'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Origin': '*'},
            url: SERVER_URL + '/storyboard/metadata/' + Settings.instance.datasetKey,
          })
          .then(function (response) {
              //console.log(response);
              let name = response.data.name;
              document.getElementById("dataset-name").innerHTML = name;
          })
          .catch(function (error) {
              console.error(error);
          });
    }


    /** --------------- TEST CASES --------------- */

    static LoadFramesDemo(demoNr) {
        let frames;
        switch (demoNr) {
            case 1:
                frames = require('./demos/demo1');
                break;
            case 2:
                frames = require('./demos/demo2');
                break;
        }
        Storyboard.instance.setFrames(frames);
    }

    static LoadFramesDemoJson(datasetNr) {
        axios({
            method: 'get',
            headers: {'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Origin': '*'},
            url: APP_URL + '/js/demos/datasets/dataset' + datasetNr + ".json",
          })
          .then(function (response) {
            Settings.instance.settings["s-simplification"].value = true;
            Settings.instance.settings["s-intermediate-states"].value = datasetNr;
            let frames = Loader.ParseJson(response.data.dataset);
        
            if ( response.data.children ) {
                response.data.children.forEach( (child) => {
                    axios({
                        method: 'get',
                        headers: {'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Origin': '*'},
                        url: APP_URL + '/js/demos/datasets/dataset' + datasetNr + "Child" + child + ".json",
                      })
                      .then(function (childResponse) {
                        Settings.instance.settings["s-intermediate-states"].value = 1;
                        let childFrames = Loader.ParseJson(childResponse.data.dataset);
                        frames[child].childFrames = childFrames;
                      })
                      .catch(function (error) {
                          console.error(error);
                      });
                });
            }

            Storyboard.instance.setFrames(frames);
          })
          .catch(function (error) {
              console.error(error);
          });
    }

    /** ------------------------------------------ */
}

module.exports = Loader;
