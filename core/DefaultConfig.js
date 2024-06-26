import ConfigTypes from "./ConfigTypes"

const defaultValues = [ false, 1, undefined, 0, "", [ 255, 255, 255, 255 ], false, 0, 0 ]

/**
 * @typedef {Object} DefaultObject
 * @prop {string?} category The category name for this config component
 * @prop {string?} configName The config name for this config component (used to get its current value)
 * @prop {string} title The title to be displayed for this config component
 * @prop {string} description The description to be displayed for this config component
 * @prop {string?} placeHolder The placeholder for this component (only if it supports it)
 * @prop {string|array|number?} value The current config value of this component (only if it supports it)
 * @prop {function?} shouldShow The function that runs whenever `Amaterasu` attempts to hide a component (this function should only return `Boolean`)
 * @prop {string?} subcategory The subcategory for this config component
 * @prop {array?} tags The searching tags for this component (if any is defined these will make the component come up in results whenever searching these strings)
 * @prop {function?} registerListener The function that runs whenever this component's value changes (returns params `previousValue` and `newValue`)
*/

export default class DefaultConfig {
    /**
     * - This class handles all the data required by the
     * - whole [Amaterasu]'s [Config] system
     * @param {String} moduleName The module name. this is used on the saving data process so make sure to set it correctly.
     * @param {String} filePath The file path to store the data at. default: `data/settings.json`.
     */
    constructor(moduleName, filePath = "data/settings.json") {
        this.moduleName = moduleName
        this.filePath = filePath
        this.lastCategory = null

        // Holds all the categories names
        this.categories = new Set()
        this.savedConfig = JSON.parse(FileLib.read(this.moduleName, this.filePath))
    }

    /**
     * - Internal use.
     * - Checks whether the saved data has changed from the new data
     * - This will make it so it saves the correct value and changes the [ConfigType] properly
     * @param {String} categoryName 
     * @param {String} configName 
     * @param {{}} newObj 
     * @returns 
     */
    _makeObj(categoryName, configName, newObj) {        
        categoryName = this._checkCategory(categoryName, configName)

        if (newObj.subcategory === "") newObj.subcategory = null

        const obj = this.savedConfig?.find(it => it.category === categoryName)?.settings?.find(currObj => currObj.name === configName)
        if (!obj) return this[categoryName].push(newObj)

        if (obj.type !== newObj.type) {
            newObj.value = defaultValues[newObj.type]

            this[categoryName].push(newObj)
            console.warn(`[Amaterasu - ${this.moduleName}] config type for ${configName} was changed from ${obj.type} to ${newObj.type}. therefor the object was re-created to fit these changes`)

            return
        }

        // Handle MultiCheckBox savings
        if (obj.type === ConfigTypes.MULTICHECKBOX) {
            obj.options.forEach(opts => {
                const nObj = newObj.options.find(op => op.configName === opts.name)
                if (!nObj) return

                nObj.value = opts.value
            })

            this[categoryName].push(newObj)

            return
        }

        newObj.value = obj.value
        this[categoryName].push(newObj)
    }

    /**
     * - Internal use.
     * - Checks whether the given [categoryName] is valid.
     * - also checks whether that category is created.
     * - if not we create it.
     * @param {String} categoryName 
     * @param {String} configName 
     * @returns {String} the category name itself
     */
    _checkCategory(categoryName, configName) {
        if (!categoryName && !this.lastCategory) throw new Error(`${categoryName} is not a valid Category Name.`)
        if (configName === "getConfig") throw new Error(`[Amaterasu - ${this.moduleName}] you cannot overwrite a built in function. attempting to create config with configName: ${configName}. failed please change this configName`)

        // Gets the prevous category name if [categoryName] is [null]
        categoryName = categoryName ?? this.lastCategory

        if (!categoryName) throw new Error(`${categoryName} is not a valid Category Name`)
        if (!configName) throw new Error(`${configName} is not a valid Config Name.`)

        // Create category data if it does not exist.
        if (!this.categories.has(categoryName)) {
            this[categoryName] = []
            this.categories.add(categoryName)
        }

        this.lastCategory = categoryName

        return categoryName
    }

    /**
     * - Creates a new button with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addButton({
        category = null,
        configName = null,
        title,
        description,
        placeHolder = "Click",
        onClick,
        shouldShow,
        subcategory = null,
        tags = []
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.BUTTON,
            name: configName,
            text: title,
            description,
            placeHolder,
            onClick,
            shouldShow,
            subcategory,
            tags
        })

        return this
    }

    /**
     * - Creates a new toggle with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addToggle({
        category = null,
        configName = null,
        title,
        description,
        value = false,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.TOGGLE,
            name: configName,
            text: title,
            description,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })

        return this
    }

    /**
     * - Creates a new switch with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addSwitch({
        category = null,
        configName = null,
        title,
        description,
        value = false,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.SWITCH,
            name: configName,
            text: title,
            description,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })

        return this
    }

    /**
     * - Creates a new textinput with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addTextInput({
        category = null,
        configName = null,
        title,
        description,
        value = "",
        placeHolder,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.TEXTINPUT,
            name: configName,
            text: title,
            description,
            value,
            placeHolder,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })

        return this
    }

    /**
     * - Creates a new slider with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addSlider({
        category = null,
        configName = null,
        title,
        description,
        options = [ 0, 10 ],
        value = 1,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.SLIDER,
            name: configName,
            text: title,
            description,
            options,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })

        return this
    }

    /**
     * - Creates a new selection with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addSelection({
        category = null,
        configName = null,
        title,
        description,
        options = [ "Test 1", "Test 2" ],
        value = 0,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener,
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.SELECTION,
            name: configName,
            text: title,
            description,
            options,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })

        return this
    }

    /**
     * - Creates a new color picker with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addColorPicker({
        category = null,
        configName = null,
        title,
        description,
        value = [ 255, 255, 255, 255 ],
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.COLORPICKER,
            name: configName,
            text: title,
            description,
            value,
            placeHolder: value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })

        return this
    }

    /**
     * - Creates a new drop down with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addDropDown({
        category = null,
        configName = null,
        title,
        description,
        options = [ "Test 1", "Test 2" ],
        value = 0,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.DROPDOWN,
            name: configName,
            text: title,
            description,
            options,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })

        return this
    }

    /**
     * - Creates a new multi checkbox with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addMultiCheckbox({
        category = null,
        configName = null,
        title,
        description,
        options = [],
        placeHolder = "Click",
        shouldShow,
        subcategory = null,
        tags = []
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.MULTICHECKBOX,
            name: configName,
            text: title,
            description,
            options,
            shouldShow,
            placeHolder,
            subcategory,
            tags
        })

        return this
    }

    /**
     * - Creates a new text paragraph with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addTextParagraph({
        category = null,
        configName = null,
        title,
        description,
        centered = false,
        shouldShow,
        subcategory = null,
        tags = []
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.TEXTPARAGRAPH,
            name: configName,
            text: title,
            centered,
            description,
            shouldShow,
            subcategory,
            tags
        })

        return this
    }

    /**
     * - Creates a new keybind with the given params and pushes it into the config
     * @param {DefaultObject} options
     * @returns this for method chaining
     */
    addKeybind({
        category = null,
        configName = null,
        title,
        description,
        value = 0,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.KEYBIND,
            name: configName,
            text: title,
            value,
            description,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })

        return this
    }
}