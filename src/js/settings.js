const Renderer = require('./renderer');

class SettingsManager {
    constructor() {
        this.initGroups();
        this.initSettings();
        this.initForm();
    }

    initGroups() {
        this.groups = {};

        // Scenes group
        this.groups["scenes"] = new Group(rebuildScenes);
        this.groups["layout"] = new Group(updateLayout);
        this.groups["events"] = new Group(updateParameters);
    }

    initSettings() {
        this.settings = {};

        // Event settings
        this.settings["s-translation-delta"] = new Setting(1, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-translation-relative"] = new Setting(3, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-translation-absolute"] = new Setting(10, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-orientation-delta"] = new Setting(0.05, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-orientation-relative"] = new Setting(0.3, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-orientation-absolute"] = new Setting(45, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-scale-delta"] = new Setting(0.1, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-scale-relative"] = new Setting(0.3, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-scale-absolute"] = new Setting(2, [this.groups["events"]], updateFloat, updateNumberHTML);
        this.settings["s-detail-multiplier"] = new Setting(0.75, [this.groups["events"]], updateFloat, updateNumberHTML);

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

        Object.values(this.groups).forEach(group => {
            if ( group.needsUpdate ) {
                group.update();
                group.needsUpdate = false;
            }
        });
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
        this.updateFunction.call();
    }
}

// Group actions
function rebuildScenes() {
    Renderer.instance.rebuildScenes();
}

function updateLayout() {
    Renderer.instance.update();
}

function updateParameters() {
    console.error("updateParameters: function not implemented");
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
    let changed = this.value != input.value;
    this.value = parseInt(input.value);
    return changed;
}

function updateFloat(input) {
    let changed = this.value != input.value;
    this.value = parseFloat(input.value);
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
