
class SettingsManager {
    constructor() {
        SettingsManager.instance = this;
        this.initGroups();
        this.initSettings();
        this.initForm();
    }

    initGroups() {
        this.groups = {};

        // Scenes group
        this.groups["scenes"] = new Group(rebuildScenes);
    }

    initSettings() {
        this.settings = {};

        this.settings["s-vertex-mapping"] = new Setting(true, [this.groups["scenes"]], updateSwitch, updateSwitchHTML);
    }

    initForm() {
        this.form = document.getElementById("settings-form");
        this.formInputs = this.form.getElementsByTagName("input");
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
                setting.update(input);
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

    setRenderer(renderer) {
        this.renderer = renderer;
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
        this.updateFunction.call(this, input);
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
    SettingsManager.instance.renderer.rebuildScenes();
}

// Settings actions
function updateSwitch(input) {
    if (this.value != input.checked) {
        this.notifyGroups();
    }

    this.value = input.checked;
}

function updateSwitchHTML(input) {
    input.checked = this.value;
}

module.exports = SettingsManager;
