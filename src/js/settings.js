const Renderer = require('./renderer');
const Loader = require('./loader');

class SettingsManager {
    constructor() {
        this.initGroups();
        this.initSettings();
        this.initForm();
        this.initDataset();
    }

    initGroups() {
        this.groups = {};

        this.groups["events"] = new Group(updateParameters);
        this.groups["scenes"] = new Group(rebuildScenes);
        this.groups["layout"] = new Group(updateLayout);
    }

    initSettings() {
        this.settings = {};

        // Event settings
        this.settings["s-translation-delta"] = new Setting(10, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-translation-directed"] = new Setting(50, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-translation-absolute"] = new Setting(100, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-translation-noise"] = new Setting(0.2, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-translation-detail-multiplier"] = new Setting(0.5, [this.groups["events"]], updateFloat, updateNumberHTML);

        this.settings["s-orientation-delta"] = new Setting(15, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-orientation-directed"] = new Setting(25, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-orientation-absolute"] = new Setting(45, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-orientation-noise"] = new Setting(0.2, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-orientation-detail-multiplier"] = new Setting(0.5, [this.groups["events"]], updateFloat, updateNumberHTML);

        this.settings["s-scale-delta"] = new Setting(0.1, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-scale-directed"] = new Setting(0.3, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-scale-absolute"] = new Setting(2, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-scale-noise"] = new Setting(0.01, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-scale-detail-multiplier"] = new Setting(0.5, [this.groups["events"]], updateFloat, updateNumberHTML);

        this.settings["s-immutability-threshold"] = new Setting(1000, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-immutability-detail-multiplier"] = new Setting(0.5, [this.groups["events"]], updateFloat, updateNumberHTML);

        // Scene settings
        this.settings["s-vertex-mapping"] = new Setting(true, [this.groups["scenes"]], updateSwitch, updateSwitchHTML);
        this.settings["s-arrow"] = new Setting(true, [this.groups["scenes"]], updateSwitch, updateSwitchHTML);
        this.settings["s-grid"] = new Setting(true, [this.groups["scenes"]], updateSwitch, updateSwitchHTML);
        this.settings["s-overlay"] = new Setting(true, [this.groups["scenes"], this.groups["layout"]], updateSwitch, updateSwitchHTML);
        this.settings["s-simplification"] = new Setting(false, [this.groups["scenes"]], updateSwitch, updateSwitchHTML);
        this.settings["s-intermediate-states"] = new Setting(-1, [this.groups["scenes"]], updateNumber, updateNumberHTML);
        this.settings["s-color"] = new Setting(0, [this.groups["scenes"]], updateNumber, updateRangeHTML);

        // Layout settings
        this.settings["s-description"] = new Setting(true, [this.groups["layout"]], updateSwitch, updateSwitchHTML);
        this.settings["s-hierarchy"] = new Setting("fill", [], updateSelect, updateSelectHTML);
    }

    initForm() {
        this.form = document.getElementById("settings-form");
        this.formInputs = this.form.querySelectorAll("input,select");
        this.submitButton = document.getElementById("settings-form-submit");
        let thisManager = this;
        this.submitButton.addEventListener("click", (event) => {
            thisManager.onSettingsSaved(event);
        });

        this.openModalButton = document.getElementById("settings");
        this.openModalButton.addEventListener("click", (event) => {
            thisManager.onModalOpen(event);
        });
    }

    initDataset() {
        this.datasetKey = null;
        let settingsInstance = this;
        let datasetInput = document.getElementById("dataset-key");
        datasetInput.addEventListener("change", (event) => {
            let key = parseInt(event.target.value);
            if ( !isNaN(key) && key !== settingsInstance.datasetKey ) {
                settingsInstance.datasetKey = key;
                Loader.LoadDataset();
            }
        });
    }

    onSettingsSaved(event) {
        for (let i = 0; i < this.formInputs.length; i++) {
            let input = this.formInputs[i];
            let setting = this.settings[input.id];

            if ( setting !== undefined ) {
                if ( setting.update(input) ) {
                    setting.notifyGroups();
                }
            }
        }

        for (let groupKey in this.groups) { 
            let group = this.groups[groupKey]; 

            if ( group.needsUpdate ) {
                let shouldStop = group.update();
                group.needsUpdate = false;
                if ( shouldStop )
                    break;
            }
        }
    }

    onModalOpen(event) {
        for (let i = 0; i < this.formInputs.length; i++) {
            let input = this.formInputs[i];
            let setting = this.settings[input.id];

            if ( setting !== undefined ) {
                setting.updateHTML(input);
            }
        }
    }

    getSettingValue(key) {
        return this.settings[key].value;
    }
}

class Setting {
    constructor(defaultValue, groups, updateFunction, updateHTMLFunction) {
        this.value = defaultValue;
        this.defaultValue = defaultValue;
        this.updateFunction = updateFunction;
        this.updateHTMLFunction = updateHTMLFunction;
        this.groups = groups;
    }

    update(input) {
        return this.updateFunction.call(this, input);
    }

    updateHTML(input) {
        this.updateHTMLFunction.call(this, input);
    }

    notifyGroups() {
        this.groups.forEach(group => {
            group.needsUpdate = true;
        });
    }
}

class Group {
    constructor(updateFunction) {
        this.needsUpdate = false;
        this.updateFunction = updateFunction;
    }

    update() {
        return this.updateFunction.call();
    }
}

// Group actions
function rebuildScenes() {
    Renderer.instance.rebuildScenes();
    return false;
}

function updateLayout() {
    Renderer.instance.update();
    return false;
}

function updateParameters() {
    Loader.LoadDataset();
    return true;
}

// Settings actions
function updateSwitch(input) {
    let changed = this.value != input.checked;
    this.value = input.checked;
    return changed;
}

function updateSwitchHTML(input) {
    input.checked = this.value;
}

function updateSelect(input) {
    let changed = this.value != input.value;
    this.value = input.value;
    return changed;
}

function updateSelectHTML(input) {
    input.value = this.value;
}

function updateNumber(input) {
    let parsedValue = parseInt(input.value);
    let changed = this.value != parsedValue && !(isNaN(this.value) && isNaN(parsedValue));
    this.value = parsedValue;
    return changed;
}

function updateFloat(input) {
    let parsedValue = parseFloat(input.value);
    let changed = this.value != parsedValue && !(isNaN(this.value) && isNaN(parsedValue));
    this.value = parsedValue;
    return changed;
}

function updateNumberHTML(input) {
    input.value = this.value;
}

function updateRangeHTML(input) {
    input.value = this.value;
    input.oninput({ target: input });
}

module.exports.instance = new SettingsManager();
