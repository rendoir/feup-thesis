var settingsInstance;

class SettingsManager {
    constructor() {
        settingsInstance = this;
        this.initGroups();
        this.initSettings();
        this.initForm();
    }

    initGroups() {
        this.group = {};

        // Scenes group
        this.group["scenes"] = new Group(rebuildScenes);
    }

    initSettings() {
        this.settings = {};

        this.settings["s-vertex-mapping"] = new Setting(true, updateSwitch);
    }

    initForm() {
        this.form = document.getElementById("settings-form");
        this.formInputs = this.form.getElementsByTagName("input");
        this.submitButton = document.getElementById("settings-form-submit");
        let thisManager = this;
        this.submitButton.addEventListener("click", (event) => {
            thisManager.onSettingsSaved(event);
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
    }

    getSettingValue(key) {
        return this.settings[key].value;
    }

    setRenderer(renderer) {
        this.renderer = renderer;
    }
}

class Setting {
    constructor(defaultValue, updateFunction) {
        this.value = defaultValue;
        this.defaultValue = defaultValue;
        this.updateFunction = updateFunction;
    }

    update(input) {
        this.updateFunction.call(this, input);
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
    settingsInstance.renderer.rebuildScenes();
}

// Settings actions
function updateSwitch(input) {
    this.value = input.checked;
}

module.exports = {
    SettingsManager : SettingsManager,
    settingsInstance : settingsInstance
};
