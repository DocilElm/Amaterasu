import ConfigTypes from "./ConfigTypes"

const defaultValues = new Map()
const configInstances = new (java.util.WeakHashMap)()

defaultValues.set(ConfigTypes.TOGGLE, false)
defaultValues.set(ConfigTypes.SLIDER, 1)
defaultValues.set(ConfigTypes.BUTTON, null)
defaultValues.set(ConfigTypes.SELECTION, 0)
defaultValues.set(ConfigTypes.TEXTINPUT, "")
defaultValues.set(ConfigTypes.COLORPICKER, [255, 255, 255, 255])
defaultValues.set(ConfigTypes.SWITCH, false)
defaultValues.set(ConfigTypes.DROPDOWN, 0)
defaultValues.set(ConfigTypes.MULTICHECKBOX, 0)

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
     * @param {string} configPath The file path to store the data at. default: `data/settings.json`.
     */
    constructor(moduleName = "SetMe", configPath = "data/settings.json") {
        /** @type {string} */
        this.moduleName = moduleName
        /** @type {string} */
        this.configPath = configPath
        /** @type {string?} */
        this.lastCategory = null
        /** @type {Set<string>} */
        this.categoryNames = new Set()
        const cachedFile = FileLib.read(this.moduleName, this.configPath)
        /** @type {[]} */
        this.savedData = JSON.parse(cachedFile || this._attemptRestore())
        /** @type {{ category: string, settings: DefaultDefaultObject[] }[]} */
        this.config = []
        /**
         * @type {?import("./Settings").default<this>}
         */
        this.instance = null

        configInstances.put(this, false)
    }

    /**
     * @private
     * @param {string} stage
     * @param {string} msg
     */
    throwError(stage, err) {
        throw `AmaterasuError[module=\"${this.moduleName}\", stage=\"${stage}\", error=\"${err}\"]`
    }

    /**
     * @private
     * @param {string} msg
     */
    warn(msg) {
        console.warn(`AmaterasuWarn[module=\"${this.moduleName}\", message=\"${msg}\"]`)
    }

    /**
     * - Attempts to restore a corrupted saved config with the backup data (if any exists)
     * @private
     */
    _attemptRestore() {
        return "[]" // TODO: impl me
    }

    /**
     * @private
     */
    _init() {
        this._buildObj()
        return this
    }

    /**
     * - Builds the necessary objects that are later used for settings
     * @private
     */
    _buildObj() {
        this.categoryNames.forEach((categoryName) => {
            /** @type {DefaultDefaultObject[]} */
            const defaultList = this[categoryName]

            for (let defaultObj of defaultList)
                this._addObj(categoryName, defaultObj)
        })
    }

    /**
     * @private
     * @param {string} categoryName
     * @param {DefaultDefaultObject} obj
     * @returns
     */
    _addObj(categoryName, obj) {
        const configObj = this.config.find((it) => it.category === categoryName)
        if (!configObj) {
            this.config.push({
                category: categoryName,
                settings: [obj]
            })
            return
        }

        configObj.settings.push(obj)
    }

    /**
     * @private
     * @param {string} categoryName
     * @returns {string}
     */
    _getCategory(categoryName) {
        if (!categoryName && !this.lastCategory) return this.throwError("Category", `\"${categoryName}\" is not valid`)
        if (categoryName == "getConfig") return this.throwError("Category", `Cannot override getConfig as that is a built in function.`)

        categoryName = categoryName ?? this.lastCategory
        if (!categoryName) return this.throwError("Category", `${categoryName} is not valid.`)

        if (!this.categoryNames.has(categoryName)) {
            this[categoryName] = []
            this.categoryNames.add(categoryName)
        }

        this.lastCategory = categoryName

        return categoryName
    }

    // The key here is to not check for configType limitation
    // since this leaves the door open for others to create their own types
    /**
     * @private
     * @param {string} categoryName
     * @param {string} configName
     * @param {DefaultDefaultObject} obj
     */
    _addConfig(categoryName, configName, obj) {
        categoryName = this._getCategory(categoryName)
        if (obj.subcategory === "") obj.subcategory = null

        const savedObj = this._findCategory(categoryName)?.settings?.find((it) => it.name === configName)
        if (!savedObj) return this[categoryName].push(obj)

        // Handle type change (SWITCH to COLORPICKER etc) here
        if (savedObj.type !== obj.type) {
            obj.value = defaultValues.get(obj.type)
            this[categoryName].push(obj)
            this.warn(`${configName} type changed, object was re-created.`)
            return
        }

        // Handle Multi Checkbox here
        if (savedObj.type === ConfigTypes.MULTICHECKBOX) {
            savedObj.options.forEach((opt) => {
                const data = obj.options.find((it) => it.configName === opt.name)
                if (!data) return

                data.value = opt.value
            })
            this[categoryName].push(obj)
            return
        }

        // Fallthrough to normal behavior
        obj.value = savedObj.value
        this[categoryName].push(obj)
    }

    /**
     * @private
     */
    _save() {
        let data = []

        for (let obj of this.config) {
            let toSave = {
                category: obj.category,
                settings: []
            }

            for (let setting of obj.settings) {
                if (setting.type === ConfigTypes.MULTICHECKBOX) {
                    let checkboxData = {
                        type: setting.type,
                        name: setting.name,
                        options: []
                    }

                    for (let opt of setting.options) {
                        checkboxData.options.push({
                            name: opt.configName,
                            value: opt.value
                        })
                    }

                    toSave.settings.push(checkboxData)
                    continue
                }

                toSave.settings.push({
                    type: setting.type,
                    name: setting.name,
                    value: setting.value
                })
            }

            data.push(toSave)
        }

        FileLib.write(
            this.moduleName,
            this.configPath,
            JSON.stringify(data, null, 4),
            true
        )
    }

    /**
     * @private
     * @param {*} data
     */
    _normalize(data) {
        for (let obj of this.config) {
            for (let setting of obj.settings) {
                if (setting.type === ConfigTypes.MULTICHECKBOX) {
                    for (let opt of setting.options) data[opt.configName] = opt.value
                    continue
                }
                data[setting.name] = setting.value
            }
        }
    }

    /**
     * @private
     * @returns {Readonly<P> & { getConfig() => import("./Settings").default<DefaultConfig<P, C, A, L>> }}
     */
    _settings() {
        const data = {}
        this._normalize(data)

        data.getConfig = () => this.instance
        this.instance.settings = data

        return data
    }

    /**
     * @private
     * @param {string} categoryName
     * @returns
     */
    _findCategory(categoryName) {
        return this.savedData.find((it) => it.category === categoryName)
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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
        this._addConfig(category, configName, {
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

register("gameUnload", () => {
    new Thread(() => {
        configInstances.keySet().forEach((ins) => {
            let parent = ins.instance
            ins._save()
            if (!parent) return
    
            let gui = parent.handler.ctGui
            if (gui.isOpen()) gui.close()
    
            parent.handler = null
            ins.instance = null
        })
    }).start()
})