import ConfigTypes from "./ConfigTypes"

const defaultValues = [ false, 1, undefined, 0, "", [ 255, 255, 255, 255 ], false ]

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

        // Gets the prevous category name if [categoryName] is [null]
        categoryName = categoryName ?? this.lastCategory

        if (!categoryName) throw new Error(`${categoryName} is not a valid Category Name`)
        if (!configName) throw new Error(`${configName} is not a valid Confi gName.`)

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
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addButton({ category = null, configName = null, title, description, placeHolder = "Click", onClick, shouldShow, subcategory = null, tags = [] }) {
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
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addToggle({ category = null, configName = null, title, description, value = false, shouldShow, subcategory = null, tags = [] }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.TOGGLE,
            name: configName,
            text: title,
            description,
            value,
            shouldShow,
            subcategory,
            tags
        })

        return this
    }

    /**
     * - Creates a new switch with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addSwitch({ category = null, configName = null, title, description, value = false, shouldShow, subcategory = null, tags = [] }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.SWITCH,
            name: configName,
            text: title,
            description,
            value,
            shouldShow,
            subcategory,
            tags
        })

        return this
    }

    /**
     * - Creates a new textinput with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addTextInput({ category = null, configName = null, title, description, value = "", placeHolder, shouldShow, subcategory = null, tags = [] }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.TEXTINPUT,
            name: configName,
            text: title,
            description,
            value,
            placeHolder,
            shouldShow,
            subcategory,
            tags
        })

        return this
    }

    /**
     * - Creates a new slider with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addSlider({ category = null, configName = null, title, description, options = [ 0, 10 ], value = 1, shouldShow, subcategory = null, tags = [] }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.SLIDER,
            name: configName,
            text: title,
            description,
            options,
            value,
            shouldShow,
            subcategory,
            tags
        })

        return this
    }

    /**
     * - Creates a new selection with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addSelection({ category = null, configName = null, title, description, options = [ "Test 1", "Test 2" ], value = 0, shouldShow, subcategory = null, tags = [] }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.SELECTION,
            name: configName,
            text: title,
            description,
            options,
            value,
            shouldShow,
            subcategory,
            tags
        })

        return this
    }

    /**
     * - Creates a new color picker with the given params and pushes it into the config
     * @param {Object} param0 
     * @returns this for method chaining
     */
    addColorPicker({ category = null, configName = null, title, description, value = [ 255, 255, 255, 255 ], shouldShow, subcategory = null, tags = [] }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.COLORPICKER,
            name: configName,
            text: title,
            description,
            value,
            placeHolder: value,
            shouldShow,
            subcategory,
            tags
        })

        return this
    }
}