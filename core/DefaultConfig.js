import ConfigTypes from "./ConfigTypes"

export default class DefaultConfig {
    constructor() {
        this.config = {}
        this.lastCategory = null
    }

    /**
     * @returns The config object created by this class
     */
    create() {
        return this.config
    }

    _createObject(categoryName, configName, text, description, type, defaultValue, value, hideFeatureName) {
        if (this.config?.[categoryName]?.some(conf => conf[0] === configName)) throw new Error(`Tried to create config with name: ${configName}, but it already exists`)
        
        if (!this.config[categoryName]) this.config[categoryName] = []

        this.config[categoryName].push([configName, text, description, type, defaultValue, value, hideFeatureName])
    }

    _makeConfig(categoryName = null, configName = null, type, text, description, defaultValue, value, hideFeatureName) {
        categoryName = categoryName ?? this.lastCategory

        this.lastCategory = categoryName
        this._createObject(
            categoryName,
            configName,
            text ?? "",
            description ?? "",
            type,
            defaultValue,
            value ?? defaultValue,
            hideFeatureName
        )

        return this
    }

    /**
     * - Creates a new button with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addButton({ categoryName = null, configName = null, text, description, hideFeatureName }) {
        this._makeConfig(
            categoryName,
            configName,
            ConfigTypes.BUTTON,
            text,
            description,
            0,
            0,
            hideFeatureName
        )

        return this
    }

    /**
     * - Creates a new toggle with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addToggle({ categoryName = null, configName = null, text, description, defaultValue, value, hideFeatureName }) {
        this._makeConfig(
            categoryName,
            configName,
            ConfigTypes.TOGGLE,
            text,
            description,
            defaultValue,
            value,
            hideFeatureName
        )

        return this
    }

    /**
     * - Creates a new switch with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addSwitch({ categoryName = null, configName = null, text, description, defaultValue, value, hideFeatureName }) {
        this._makeConfig(
            categoryName,
            configName,
            ConfigTypes.SWITCH,
            text,
            description,
            defaultValue,
            value,
            hideFeatureName
        )

        return this
    }

    /**
     * - Creates a new textinput with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addTextInput({ categoryName = null, configName = null, text, description, defaultValue, value, hideFeatureName }) {
        this._makeConfig(
            categoryName,
            configName,
            ConfigTypes.TEXTINPUT,
            text,
            description,
            defaultValue,
            value,
            hideFeatureName
        )

        return this
    }

    /**
     * - Creates a new slider with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addSlider({ categoryName = null, configName = null, text, description, defaultValue = [ 0, 10 ], value = 1, hideFeatureName }) {
        this._makeConfig(
            categoryName,
            configName,
            ConfigTypes.SLIDER,
            text,
            description,
            defaultValue,
            value,
            hideFeatureName
        )

        return this
    }

    /**
     * - Creates a new selection with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addSelection({ categoryName = null, configName = null, text, description, defaultValue = [ "Test 1", "Test 2" ], value = 0, hideFeatureName }) {
        this._makeConfig(
            categoryName,
            configName,
            ConfigTypes.SELECTION,
            text,
            description,
            defaultValue,
            value,
            hideFeatureName
        )

        return this
    }

    /**
     * - Creates a new color picker with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addColorPicker({ categoryName = null, configName = null, text, description, defaultValue = [ 255, 255, 255 ], value, hideFeatureName }) {
        this._makeConfig(
            categoryName,
            configName,
            ConfigTypes.COLORPICKER,
            text,
            description,
            defaultValue,
            value,
            hideFeatureName
        )

        return this
    }
}