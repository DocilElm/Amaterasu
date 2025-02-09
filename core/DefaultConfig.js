import ConfigTypes from "./ConfigTypes"

const defaultValues = [false, 1, undefined, 0, "", [255, 255, 255, 255], false, 0, 0]

/**
 * @typedef {string|number|number[]} DefaultObjectValue
 */

/**
 * @template {string} ConfigName
 * @template {string?} CategoryName
 * @template {DefaultObjectValue?} Value
 * @template {(number|string|MultiCheckBoxChildObject)[]} Options
 * @typedef {object} DefaultObject
 * @prop {CategoryName} category The category name for this config component
 * @prop {ConfigName} configName The config name for this config component (used to get its current value)
 * @prop {string} title The title to be displayed for this config component
 * @prop {string} description The description to be displayed for this config component
 * @prop {string?} placeHolder The placeholder for this component (only if it supports it)
 * @prop {Value} value The current config value of this component (only if it supports it)
 * @prop {?(data: R<string, DefaultObjectValue>) => boolean} shouldShow The function that runs whenever `Amaterasu` attempts to hide a component (this function should only return `Boolean`) (it is passed the `Settings::settings` object)
 * @prop {?(data: import("./Settings").default) => void} onClick The function that runs whenever a button is clicked (it is passed the `Settings` object)
 * @prop {string?} subcategory The subcategory for this config component
 * @prop {string[]?} tags The searching tags for this component (if any is defined these will make the component come up in results whenever searching these strings)
 * @prop {?(previousValue: Value, newValue: Value) => void} registerListener The function that runs whenever this component's value changes (returns params `previousValue` and `newValue`)
 * @prop {Options?} options Usage varies depending on type of setting. [min, max] for slider, options for checkbox/multicheck box (strings in checkbox, nested objects for multi), and probably more. Pay me.
 * @prop {boolean?} centered Whether the [title] and [description] should be centered
*/

/**
 * @typedef {DefaultObject<string, string, DefaultObjectValue, (number|string|MultiCheckBoxChildObject)[]>} DefaultDefaultObject
 */

/**
 * @template {string} ConfigName
 * @typedef {object} MultiCheckBoxChildObject
 * @prop {string} title The title to be displayed for this config component
 * @prop {ConfigName} configName The config name for this config component (used to get its current value)
 * @prop {boolean?} value The current config value of this component
 */

/**
 * @template K
 * @template [V = undefined]
 * @typedef {Record<K, V>} R
 */

/**
 * @template [P = R<never>]
 * @template [C = R<never>]
 * @template [A = R<never>]
 * @template {string} [L = never]
 */
export default class DefaultConfig {

    /**
     * - This class handles all the data required by the
     * - whole [Amaterasu]'s [Config] system
     * @param {string} moduleName The module name. this is used on the saving data process so make sure to set it correctly.
     * @param {string} filePath The file path to store the data at. default: `data/settings.json`.
     */
    constructor(moduleName, filePath = "data/settings.json") {
        /**
         * @type {string}
         */
        this.moduleName = moduleName
        /**
         * @type {string}
         */
        this.filePath = filePath
        /**
         * @type {string?}
         */
        this.lastCategory = null

        /**
         * Holds all the categories names
         * @type {Set<string>}
         */
        this.categories = new Set()
        /**
         * @type {any[]}
         */
        this.savedConfig = JSON.parse(FileLib.read(this.moduleName, this.filePath) || "{}")

        /**
         * Config stuff
         * @type {{ category: string, settings: DefaultDefaultObject[] }[]}
         */
        this.config = []
        /**
         * @type {?import("./Settings").default<this>}
         */
        this.settingsInstance = null

        // Registers
        register("gameUnload", this._saveToFile.bind(this))
    }

    /**
     * @private
     * - Internal use.
     * - Used to setup all the configs after the defaults are set.
     * - This is done this way due to the default configurations being created before the `Settings` instance
     * @returns {this}
     */
    _init() {
        this._makeConfig()
        this._saveToFile()
        return this
    }

    /**
     * @private
     * - Internal use.
     * - Checks whether the saved data has changed from the new data
     * - This will make it so it saves the correct value and changes the [ConfigType] properly
     * @param {string} categoryName
     * @param {string} configName
     * @param {DefaultDefaultObject} newObj
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
     * @private
     * - Internal use.
     * - Checks whether the given [categoryName] is valid.
     * - also checks whether that category is created.
     * - if not we create it.
     * @param {string} categoryName
     * @param {string} configName
     * @returns {string} the category name itself
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
     * @private
     * - Internal use.
     */
    _makeConfig() {
        this.categories.forEach(categoryName => {
            const settings = this[categoryName]

            settings.forEach(dobj => {
                const obj = this.config.find(names => names.category === categoryName)
                if (!obj) return this.config.push({ category: categoryName, settings: [dobj] })

                obj.settings.push(dobj)
            })
        })
    }

    /**
     * @private
     * - Internal use.
     * - Makes the current config into an actual dev friendly format
     * - e.g instead of `[Settings: { name: "configName", text: "config stuff" ...etc }]`
     * converts it into `{ configName: false }`
     * @returns {P & { getConfig() => import("./Settings").default<this> }}
     */
    _normalizeSettings() {
        // TODO: change this to only be ran once per feature change
        // rather than everytime one changes re-scan the entire thing and re-build it
        let settings = {}

        this.config.forEach(obj => {
            obj.settings.forEach(settingsObj => {
                if (settingsObj.type === ConfigTypes.MULTICHECKBOX) {
                    settingsObj.options.forEach(opts => {
                        settings[opts.configName] = opts.value
                    })
                    return
                }

                settings[settingsObj.name] = settingsObj.value
            })
        })

        settings.getConfig = () => this.settingsInstance

        this.settingsInstance.settings = settings

        return settings
    }

    /**
     * - Internal use.
     * - Saves the current config json into the module's given config file path
     */
    _saveToFile() {
        const data = this.config.map(it => ({
            category: it.category,
            settings: it.settings.map(it2 => {
                // Perfection.
                if (it2.type === ConfigTypes.MULTICHECKBOX) return { type: it2.type, name: it2.name, options: it2.options.map(opts => { return { name: opts.configName, value: opts.value } }) }

                return { type: it2.type, name: it2.name, value: it2.value }
            })
        }))

        FileLib.write(
            this.moduleName,
            this.filePath,
            JSON.stringify(data, null, 4),
            true
        )
    }

    /**
     * - Creates a new button with the given params and pushes it into the config
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G extends string ? G : L, undefined, undefined>} options
     * @returns {DefaultConfig<P, C & R<G extends string ? G : L, R<N>>, A, G extends string ? G : L>} this for method chaining
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
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G extends string ? G : L, boolean, undefined>} options
     * @returns {DefaultConfig<P & R<N, boolean>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, boolean>>, G extends string ? G : L>} this for method chaining
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
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, boolean, undefined>} options
     * @returns {DefaultConfig<P & R<N, boolean>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, boolean>>, G extends string ? G : L>} this for method chaining
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
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, string, undefined>} options
     * @returns {DefaultConfig<P & R<N, string>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, string>>, G extends string ? G : L>} this for method chaining
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
     * - For a decimal slider, the first number of the `options` property should include a decimal e.g. 0.01
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, number, [number, number]>} options
     * @returns {DefaultConfig<P & R<N, number>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, number>>, G extends string ? G : L>} this for method chaining
     */
    addSlider({
        category = null,
        configName = null,
        title,
        description,
        options = [0, 10],
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
     * - The `value` property is the index of the option, not the option itself
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, number, string[]>} options
     * @returns {DefaultConfig<P & R<N, number>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, number>>, G extends string ? G : L>} this for method chaining
     */
    addSelection({
        category = null,
        configName = null,
        title,
        description,
        options = ["Test 1", "Test 2"],
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
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, [number, number, number, number], undefined>} options
     * @returns {DefaultConfig<P & R<N, [number, number, number, number]>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, [number, number, number, number]>>, G extends string ? G : L>} this for method chaining
     */
    addColorPicker({
        category = null,
        configName = null,
        title,
        description,
        value = [255, 255, 255, 255],
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
     * - The `value` property is the index of the option, not the option itself
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, number, string[]>} options
     * @returns {DefaultConfig<P & R<N, number>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, number>>, G extends string ? G : L>} this for method chaining
     */
    addDropDown({
        category = null,
        configName = null,
        title,
        description,
        options = ["Test 1", "Test 2"],
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
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<undefined, G, undefined, MultiCheckBoxChildObject<N>[]>} options
     * @returns {DefaultConfig<P & R<N, boolean>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, boolean>>, G extends string ? G : L>} this for method chaining
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
     * - This is for displaying text, not for a paragraph input
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, undefined, undefined>} options
     * @returns {DefaultConfig<P, C & R<G extends string ? G : L, R<N>>, A, G extends string ? G : L>} this for method chaining
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
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, number, undefined>} options
     * @returns {DefaultConfig<P & R<N, number>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, number>>, G extends string ? G : L>} this for method chaining
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