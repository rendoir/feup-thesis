# Documentation

## Installing and Running
### Prerequisites
To run the application make sure you have `docker` and `docker-compose` installed.

### Running
1. Clone the repository
    ```shell
    git clone https://github.com/rendoir/feup-thesis.git
    cd feup-thesis/src/
    ```

2. Run the application
    - For deployment
        ```shell
        docker-compose up
        ```

    - For development
        ```shell
        docker-compose -f docker-compose.dev.yml up
        ```

3. Open your browser
    - In deployment
        ```
        http://127.0.0.1:8080/visualization/1/
        ```

    - In development
        ```
        http://127.0.0.1:8080/
        ```

### Entry Points
The application's entry point is located in `main.js`. There are three types of entry points:
1. `Loader.LoadFramesDemo`: Loads hardcoded frames from a Javascript file which uses the current API to construct the frames. This entry point is generally used for unit testing. Example: `src/js/demos/demo1.js`.
2. `Loader.LoadFramesDemoJson`: Loads frames from a JSON file with a similar schema to the one used for server communication. The difference is that this entry point also supports one level of child frames. This entry point is generally used for user testing. Example: `src/js/demos/datasets/dataset1.json`.
3. `Loader.LoadDataset`: Retrieves an initial set of frames from the object change identification and quantification server. This entry point is used for connecting the application with a server that supplies spatiotemporal events. The dataset whose events are requested is given by `Settings.instance.datasetKey` and the server URL can be edited in `loader.js` (`SERVER_URL`).


## Supporting a new Transformation
1. **Create a visual metaphor**  
The visual metaphors are defined in `transformation.js`. To create a new transformation, create a new class that derives from the `Transformation` class.
    ```javascript
    class MyNewTransformation extends Transformation {
        // ...
    }
    ```
    The following methods must be implemented:  
    - `getName()`: Returns a `String` with the name of the transformation.
    - `getDetails()`: Returns a `String` with a verbose description of the transformation.
    - `getOverlayDetails()`: Returns a `String` with a condensed description of the transformation to be used in the overlay.
    - `setupScene(scene, object)`: Defines the visual metaphor of the transformation. It receives a Three.js scene and an Object (`object.js`). When implementing this function, the base class's method **must be called** (`super.setupScene(scene, object)`) before any other logic. Moreover, the methods `setupSceneCamera()` and `setupGrid()` **must be called** at the end of the visual metaphor logic (in the aforementioned order).  <br><br>
    The logic of the new transformation's visual contents must be placed between these blocks and **should** begin by setting up the object's states. The previously implemented methods can be used towards this goal (`setupOnionSkinning()`, `setupInitialFinalStates()`, or `setupInitialState()`) which internally all use `_setupObjectStates(states)` with the given object states. This process can be customized by overriding the `_getColor(i, nStates)` and `_getOpacity(i, nStates)` which define the colour and opacity of the *i*<sup> th</sup> state.  <br><br> 
    Afterwards, visual variables can be added to the scene to further represent the transformation. In situations where these variables are placed outside of the scene's bounding box, the bounding box should be expanded using the `sceneBoundingBox.expandBy*` family of methods, available through Three.js.

2. **Add new settings**  
New transformation might need additional settings, either for customizing visual logic or for parameterization.   <br><br> 
To add new settings: 
    - Add a new entry in `initSettings()` in `settings.js`
        ```javascript
        this.settings["s-my-setting-name"] = new Setting(defaultValue, arrayOfDependentGroups, updateCallbackFunction, updateHTMLCallbackFunction);
        ```

        When a user modifies the settings through the modal, the `updateCallbackFunction` is called. This method should return whether or not the value was changed. If the value was changed, every group in `arrayOfDependentGroups` is notified and its callback is executed (only once per update). For visual variable settings, the dependent group should be *scenes* while the group for parameterization settings should be set to *events*. The `updateHTMLCallbackFunction` callback is called when the modal is opened to update its values.
        
    - Add a new entry to the modal in `#settings-form` in `index.html`
        ```html
        <label for="s-my-setting-name">My Setting Name</label>
        <input type="my-type" id="s-my-setting-name">
        ```

    The new setting can be retrieved using `SettingsManager.instance.getSettingValue("s-my-setting-name")`. Keep in mind that this value should be cached whenever possible (e.g., in `setupScene`) to avoid multiple accesses.

3. **Request and parse events**
    - Request events: to request events for the new transformation, the parameterization settings introduced by the user must be sent to the server. To do this, add them to the `parameters` Javascript object inside the `SendRequest` function in `loader.js`.

    - Parse events: to parse events for the new transformation, add a new case inside the `ParseEvents` function in `loader.js` by pushing a new `MyNewTransformation` object to the `transformations` array for that frame.


## Codebase Overview
1. `controller.js`: Controller module of the Model-View-Controller architecture. Its main responsibility is to handle user interaction with the narrative, namely traversing through the storyboard, clicking on frames to retrieve more details, jumping to a certain point in the timeline, and other user experience events.  <br><br>
The file contains a Controller class which, as a singleton, is accessible via `Controller.instance`. Its most important data structure is `visibleFramesInfo` which is used to manage the narrative state in terms of timeline progress and zoomed frames. This data structure is an array of Javascript objects where each entry corresponds to a storyboard row. Each object contains a `start` property which is the first frame of the currently being viewed frames. It defaults to 0 for the narrative to start at the beginning and is incremented/decremented each time the user clicks on the right/left arrow. Each entry also contains a `zoomedFromFrame` property which corresponds to the frame from the previous row that got zoomed (is set to -1 for the first row).

2. `storyboard.js`: Model module of the Model-View-Controller architecture. Its main responsibility is to store the frames in the `frames` member variable of the `Storyboard` singleton class (accessible through `Storyboard.instance`). The `frames` property is an array of `Frame` objects (`frame.js`). Each `Frame` object also contains an array of `Frame` objects as children (`childFrames` member variable) which corresponds to the frames retrieved when a frame is zoomed.  

3. `renderer.js`: View module of the Model-View-Controller architecture. Its main responsibility is to render the frames, HTML elements, and other visual elements. It renders the frames using the `visibleFrames` data structure which is updated each time the `Controller` updates the previously described `visibleFramesInfo` data structure. The `visibleFrames` is an array of Javascript objects per storyboard row. Each entry contains an array of `Frame` objects (`frameObjects`) which are the frames that are currently being shown.  <br><br>
The renderer re-writes the HTML elements when the `visibleFramesInfo` variable is updated. In the render loop, the renderer iterates the visible frames and renders them to a WebGL fullscreen canvas. Additionally, the hierarchy visual cues are rendered to a 2D fullscreen canvas.
