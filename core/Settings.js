import ElementUtils from "../../DocGuiLib/core/Element"
import HandleGui from "../../DocGuiLib/core/Gui"
import MarkdownElement from "../../DocGuiLib/elements/Markdown"
import SearchElement from "./Search"
import { CenterConstraint, CramSiblingConstraint, OutlineEffect, ScrollComponent, UIRoundedRectangle, UIText } from "../../Elementa"
import Category from "./Category"
import ConfigTypes from "./ConfigTypes"

// Credits to @unclaimedbloom6 (big thank)
const mergeObjects = (obj1, obj2, final = {}) => {
    // Add the keys from the first object
    for (let entry of Object.entries(obj1)) {
        let [k, v] = entry
        final[k] = v
    }

    // Add the keys from the second object
    for (let entry of Object.entries(obj2)) {
        let [k, v] = entry
        // Key was already added from the first object
        if (k in final) {
            // Go a level deeper if this is an object
            if (typeof (v) == "object" && !Array.isArray(v)) {
                final[k] = mergeObjects(obj1[k], v)
            }
            continue
        }

        // Key didn't already exist, write it
        final[k] = v
    }

    return final
}

/**
 * @template {import("./DefaultConfig").default} T
 * @typedef {T extends import("./DefaultConfig").default<infer U, any, any, any> ? U : never} GetTypeP
 */
/**
 * @template {import("./DefaultConfig").default} T
 * @typedef {T extends import("./DefaultConfig").default<any, infer U, any, any> ? U : never} GetTypeC
 */
/**
 * @template {import("./DefaultConfig").default} T
 * @typedef {T extends import("./DefaultConfig").default<any, any, infer U, any> ? U : never} GetTypeA
 */
/**
 * @template {import("./DefaultConfig").default} T
 * @typedef {T extends import("./DefaultConfig").default<any, any, any, infer U> ? U : never} GetTypeL
 */

/**
 * @template {import("./DefaultConfig").default} DefaultConfig
 */
export default class Settings {
    /**
     * @param {string} moduleName
     * @param {DefaultConfig} defaultConfig
     * @param {string} colorSchemePath
     * @param {string?} titleText
     */
    constructor(moduleName, defaultConfig, colorSchemePath, titleText) {
        // Module variables
        this.moduleName = moduleName
        /** @type {DefaultConfig} */
        this.defaultConfig = defaultConfig
        this.colorSchemePath = colorSchemePath
        this.colorScheme = this._checkScheme(this.colorSchemePath)

        //
        this.handler = new HandleGui()._setColorScheme(this.colorScheme)
        this.titleText = titleText?.addColor() ?? `${this.moduleName.addColor()} Settings`
        this.sortCategories = null
        this.sortElements = null
        this.GuiScale = null

        // Listeners
        this._onOpenGui = []
        this._onCloseGui = []
        this._configListeners = new Map()
        this.generalSymbol = Symbol("all")

        this.handler.registers
            .onOpen(() => {
                // Trigger listeners
                this._onOpenGui.forEach(it => it())

                if (Client.getMinecraft().field_71474_y.field_74335_Z === 2) return

                // Save previous [GuiScale]
                this.GuiScale = Client.getMinecraft().field_71474_y.field_74335_Z
                // Set [Normal] [GuiScale]
                Client.getMinecraft().field_71474_y.field_74335_Z = 2
            })
            .onClose(() => {
                this.categories?.forEach(it => it?.createElementClass?._hideDropDownComps())

                // Trigger listeners
                this._onCloseGui.forEach(it => it())

                if (Client.getMinecraft().field_71474_y.field_74335_Z !== 2 || this.GuiScale == null) return
                if (this.GuiScale === 2) return

                Client.getMinecraft().field_71474_y.field_74335_Z = this.GuiScale
                this.GuiScale = null
            })

        // Config variables
        // Set this so we can actually have the [settings] field auto update
        // Rather than having to use a function to return its newly defined value
        this.defaultConfig.settingsInstance = this
        this.configsClass = this.defaultConfig._init() // keeping the same name because too lazy to find where else i use it
        this.config = this.configsClass.config
        /**
         * @type {ReturnType<DefaultConfig["_normalizeSettings"]>}
         */
        this.settings = this.configsClass._normalizeSettings()

        // Categories variables
        this.categories = new Map()
        this.currentCategory = null
        this.oldCategory = null
        this.markdowns = []

        // Drawing variables
        /**
         * - This should be used to edit certain aspects of this [Amaterasu] instance's [Gui]
         */
        this.AmaterasuGui = {
            /**
             * - The background (main background) of this [Gui]
             */
            background: {
                /**
                 * @type {number}
                 * - Sets the X position for the background in percent
                 * - Defaults to `20`
                 */
                x: 20,
                /**
                 * @type {number}
                 * - Sets the Y position for the background in percent
                 * - Defaults to `20`
                 */
                y: 20,
                /**
                 * @type {number}
                 * - Sets the width for the background in percent
                 * - Defaults to `60`
                 */
                width: 60,
                /**
                 * @type {number}
                 * - Sets the height for the background in percent
                 * - Defaults to `50`
                 */
                height: 50
            },
            /** 
             * @type {number}
             * - The scrollbar size (`width`) in pixels
             * - Defaults to `5` pixels
             */
            scrollbarSize: 5,
            /** 
             * - Holds size and position for the searchbar
             */
            searchBar: {
                /**
                 * @type {number}
                 * - Sets the X position for the searchBar in percent
                 * - Defaults to `68.4`
                 */
                x: 68.4,
                /**
                 * @type {number}
                 * - Sets the Y position for the searchBar in percent
                 * - Defaults to `1.5`
                 */
                y: 1.5,
                /**
                 * @type {number}
                 * - Sets the width for the searchBar in percent
                 * - Defaults to `15`
                 */
                width: 15,
                /**
                 * @type {number}
                 * - Sets the height for the searchBar in percent
                 * - Defaults to `5`
                 */
                height: 5
            },
            /** - The entire descriptionElement component (aka where the setting, title and description go) */
            descriptionElement: {
                /**
                 * @type {number}
                 * - Sets the xPadding in percent
                 * - Defaults to `1.5`
                 */
                xPadding: 1.5,
                /**
                 * - Holds data needed for description text wrapping
                 */
                textWrap: {
                    /** 
                     * - Whether or not to wrap the text
                     * - Disable this if you want the description background box to
                     * auto adjust with the description text height
                     * - Defaults to `true`
                     * @type {boolean}
                     */
                    enabled: true,
                    /**
                     * - Base lines height
                     * - Used to multiply this value by the extra lines and add
                     * to the background box
                     * - Defaults to `7`
                     * - Note: only used whenever `textWrap.enabled` is set to `false`
                     * @type {number}
                     */
                    wrapHeight: 7,
                    /**
                     * - Max lines limit (for text wrapping vertically)
                     * - Used to detection whether the description background box
                     * should change height
                     * - Defaults to `2`
                     * - Note: only used whenever `textWrap.enabled` is set to `false`
                     * @type {number}
                     */
                    linesLimit: 2,
                    /**
                     * - Lines to remove on the calculation for the new height of the description component
                     * - Defaults to `1`
                     * - Note: only used whenever `textWrap.enabled` is set to `false`
                     * @type {number}
                     */
                    removeLines: 1
                }
            },
            /**
             * - Calls the main instance's `apply` method
             * @returns {this}
             */
            apply: () => this.apply()
        }

        // Init function
        this._init()
    }

    /**
     * - Sets the command to open this gui
     * @param {string} name
     * @param {string[]} aliases
     * @returns {this} this for method chaining
     */
    setCommand(name, aliases = []) {
        this.handler.setCommand(name, aliases)

        return this
    }

    /**
     * - Function to be ran whenever the config gui attempts to sort the categories
     * - The object is passed through the function
     * - (e.g "obj" would be a param so you can then do "obj.category" for its category name)
     * - NOTE: this function should return [-1, 0, 1]
     * @param {(a: import("./DefaultConfig").DefaultDefaultObject, b: import("./DefaultConfig").DefaultDefaultObject) => number}} fn
     * @returns {this} this for method chaining
     * @see {@link apply}
     */
    setCategorySort(fn) {
        if (typeof (fn) !== "function") throw new Error(`${fn} is not a valid function`)
        this.sortCategories = fn

        return this
    }

    /**
     * - Function to be ran whenever [CreateElement] attempts to sort the config components
     * - The object is passed through the function
     * - (e.g "obj" would be a param so you can then do "obj.value" for its value)
     * - NOTE: this function should return [-1, 0, 1]
     * @param {(a: import("./DefaultConfig").DefaultDefaultObject, b: import("./DefaultConfig").DefaultDefaultObject) => number} fn
     * @returns {this} this for method chaining
     * @see {@link apply}
     */
    setElementSort(fn) {
        if (typeof (fn) !== "function") throw new Error(`${fn} is not a valid function`)
        this.sortElements = fn

        return this
    }

    /**
     * - Sets the starting x and y value of the gui (in percent)
     * @param {number} x
     * @param {number} y
     * @returns {this} this for method chaining
     * @see {@link apply}
     */
    setPos(x, y) {
        if (x) this.AmaterasuGui.background.x = x
        if (y) this.AmaterasuGui.background.y = y

        return this
    }

    /**
     * - Sets the width and height of the gui (in percent)
     * @param {number} width
     * @param {number} height
     * @returns {this} this for method chaining
     * @see {@link apply}
     */
    setSize(width, height) {
        if (width) this.AmaterasuGui.background.width = width
        if (height) this.AmaterasuGui.background.height = height

        return this
    }

    /**
     * @param {string} colorSchemePath
     * @returns {this} this for method chaining
     * @see {@link apply}
     */
    setScheme(newPath) {
        this.colorSchemePath = newPath

        this.colorScheme = this._checkScheme(this.colorSchemePath)
        this.handler._setColorScheme(this.colorScheme)

        return this
    }

    /**
     * - Sets the new config value of the given [configName]
     * - to the passed [value] then calls the `apply` method to re-build this window
     * @template {keyof GetTypeA<DefaultConfig>} CategoryName
     * @template {keyof GetTypeA<DefaultConfig>[CategoryName]} ConfigName
     * @param {CategoryName} category
     * @param {ConfigName} configName
     * @param {GetTypeA<DefaultConfig>[CategoryName][ConfigName]} value
     * @returns {this} this for method chaining
     */
    setConfigValue(category, configName, value) {
        if (!category || !configName || !this.categories.has(category)) throw new Error(`category: ${category} or configName: ${configName} are not valid.`)

        let configObj = this.config.find(it => it.category === category)?.settings?.find(it => it.name === configName)

        // Multicheckbox logic
        if (!configObj) {
            configObj = this.config.find(it => it.category === category)?.settings?.find(it => it.options?.some(n => n.configName === configName))
            if (configObj?.type === ConfigTypes.MULTICHECKBOX)
                configObj = configObj.options.find(it => it.configName === configName)
        }
        if (!configObj) return this

        let oldv = configObj.value
        configObj.value = value
        this.settings = this.configsClass._normalizeSettings()
        this.apply()

        // Trigger listener
        const editedName = configObj.name ?? configObj.configName
        this._configListeners.get(editedName)?.forEach(it => it(oldv, value, editedName))
        this._configListeners.get(this.generalSymbol)?.forEach(it => it(oldv, value, editedName))
        if (configObj.registerListener) configObj.registerListener(oldv, value, editedName)

        return this
    }

    /**
     * - Adds a [Changelog] section with the given string
     * - Equivalent to `.addMarkdown("Changelog", text)`
     * @param {string} text
     * @returns {this} this for method chaining
     */
    addChangelog(text) {
        return this.addMarkdown("Changelog", text)
    }

    /**
     * - Adds a markdown category
     * @param {string} category
     * @param {string|string[]} text
     * @returns {this} this for method chaining
     */
    addMarkdown(category, text, _internal = false) {
        if (Array.isArray(text)) text = text.join("\n")

        if (!_internal) this.markdowns.push([category, text])

        const markdownCategory = new Category(this, category, false, false)
        new MarkdownElement(text, 0, 0, 85, 85)
            ._setPosition(
                new CenterConstraint(),
                new CramSiblingConstraint(5)
            )
            ._create(this.handler.getColorScheme())
            .setChildOf(markdownCategory.rightBlock)

        this.categories.set(category, markdownCategory)

        return this
    }

    /**
     * - Gets this [Settings] CT Gui
     * @returns {Gui} the CT Gui
     */
    getGui() {
        return this.handler.ctGui
    }

    /**
     * - Gets this [Settings] HandleGui
     * @see "DocGuiLib/core/Gui.js"
     * @returns {HandleGui} the HandleGui created from DocGuiLib
     */
    getHandler() {
        return this.handler
    }

    /**
     * - Opens this [Settings] Gui
     * @returns {this} this for method chaining
     */
    openGui() {
        this.handler.ctGui.open()

        return this
    }

    /**
     * - Closes this [Settings] Gui
     * @returns {this} this for method chaining
     */
    closeGui() {
        this.handler.ctGui.close()

        return this
    }

    /**
     * - Triggers the given function whenever this [GUI] is opened
     * @param {() => void} fn
     * @returns {this} this for method chaining
     */
    onOpenGui(fn) {
        if (typeof (fn) !== "function") throw new Error(`${fn} is not a valid function.`)

        this._onOpenGui.push(fn)

        return this
    }

    /**
     * - Triggers the given function whenever this [GUI] is closed
     * @param {() => void} fn
     * @returns {this} this for method chaining
     */
    onCloseGui(fn) {
        if (typeof (fn) !== "function") throw new Error(`${fn} is not a valid function.`)

        this._onCloseGui.push(fn)

        return this
    }

    /**
     * - Runs the given function whenever the configName changes value
     * - the function will recieve the args `(previousValue, newValue, configName)`
     * @template {keyof GetTypeP<DefaultConfig>} ConfigName
     * @overload
     * @param {ConfigName} configName
     * @param {(previousValue: GetTypeP<DefaultConfig>[ConfigName], newValue: GetTypeP<DefaultConfig>[ConfigName], name: ConfigName) => void} fn
     * @returns {this} this for method chaining
     */
    /**
     * - Runs the given function whenever any config changes value
     * - the function will recieve the args `(previousValue, newValue, configName)`
     * @overload
     * @param {(previousValue: import("./DefaultConfig").DefaultObjectValue, newValue: import("./DefaultConfig").DefaultObjectValue, name: string) => void} configName
     * @returns {this} this for method chaining
     */
    registerListener(configName, fn) {
        if (!configName) throw new Error(`${configName} is not a valid config name.`)
        if (typeof configName === "function") {
            fn = configName
            configName = this.generalSymbol
        }
        if (typeof (fn) !== "function") throw new Error(`${fn} is not a valid function.`)

        if (!this._configListeners.has(configName)) this._configListeners.set(configName, [])

        this._configListeners.get(configName).push(fn)

        return this
    }

    /**
     * - Redirects the current category to the given one
     * - if a `configName` was given it will try to find it and scroll towards it
     * @template {keyof GetTypeC<DefaultConfig>} CategoryName
     * @param {CategoryName} categoryName
     * @param {?keyof GetTypeC<DefaultConfig>[CategoryName]} configName
     * @returns {this} this for method chaining
     */
    redirect(categoryName, configName = null) {
        const categoryInstance = this.categories.get(categoryName)
        if (!categoryInstance) throw new Error(`${categoryName} is not a valid category name.`)

        // Reset the state of all the categories
        this.categories.forEach(value => value._setSelected(false))

        // Set the new category's state
        this.oldCategory = null
        this.currentCategory = categoryName

        // Update the state of the given categoryName
        this.categories.get(this.currentCategory)._setSelected(true)

        if (configName) {
            Client.scheduleTask(2, () => {
                const rightBlock = categoryInstance.rightBlock
                const comp = categoryInstance.createElementClass._find(configName)?.component
                if (!comp) return

                const newY = rightBlock.getTop() - comp.getTop()
                categoryInstance.rightBlock.scrollTo(0, newY, true)
            })
        }

        return this
    }

    /**
     * - Applies the changes made to the [SettingsGui]
     * - (e.g you called #setSize you'd have to call `apply()` at the end)
     * @returns {this} this for method chaining
     */
    apply() {
        this.oldCategory = null
        this.categories.forEach(value => value._delete())
        this.handler.getWindow().clearChildren()
        this._init()

        this.markdowns.forEach(md => this.addMarkdown(...md, true))

        return this
    }

    _init() {
        this.mainBlock = new UIRoundedRectangle(this.handler.getColorScheme().Amaterasu.background.roundness)
            .setX((this.AmaterasuGui.background.x).percent())
            .setY((this.AmaterasuGui.background.y).percent())
            .setWidth((this.AmaterasuGui.background.width).percent())
            .setHeight((this.AmaterasuGui.background.height).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.background.color))
            .enableEffect(new OutlineEffect(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.background.outlineColor), this.handler.getColorScheme().Amaterasu.background.outlineSize))

        this.title = new UIText(this.titleText)
            .setX(new CenterConstraint())
            .setY((3).percent())
            .setTextScale((this.handler.getColorScheme().Amaterasu.title.scale).pixels())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.title.color))
            .setChildOf(this.mainBlock)

        this.searchBarBg = new UIRoundedRectangle(3)
            .setX((this.AmaterasuGui.searchBar.x).percent())
            .setY((this.AmaterasuGui.searchBar.y).percent())
            .setWidth((this.AmaterasuGui.searchBar.width).percent())
            .setHeight((this.AmaterasuGui.searchBar.height).percent())
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
            .setChildOf(this.mainBlock)

        this.topLine = new UIRoundedRectangle(3)
            .setX((0.5).percent())
            .setY(new CramSiblingConstraint(5))
            .setWidth((99).percent())
            .setHeight((this.handler.getColorScheme().Amaterasu.line.size).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.line.color))
            .enableEffect(new OutlineEffect(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.line.outlineColor), this.handler.getColorScheme().Amaterasu.line.outlineSize))
            .setChildOf(this.mainBlock)

        this.leftBlockBg = new UIRoundedRectangle(3)
            .setX((0.75).percent())
            .setY(new CramSiblingConstraint(5))
            .setWidth((18).percent())
            .setHeight((87).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.panel.leftColor))
            .setChildOf(this.mainBlock)

        this.leftBlock = new ScrollComponent("no elements", 5.0)
            .setX((1).percent())
            .setY((1).percent())
            .setWidth((98).percent())
            .setHeight((98).percent())
            .setChildOf(this.leftBlockBg)

        this.leftBlockScrollbar = new UIRoundedRectangle(3)
            .setX((3).pixels(true))
            .setWidth((this.AmaterasuGui.scrollbarSize).pixels())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.scrollbar.color))
            .setChildOf(this.leftBlockBg)

        this.leftBlock.setScrollBarComponent(this.leftBlockScrollbar, true, false)

        this.mainRightBlock = new UIRoundedRectangle(3)
            .setX(new CramSiblingConstraint(5))
            .setY(new CramSiblingConstraint(5))
            .setWidth((70).percent())
            .setHeight((87).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.panel.rightColor))
            .setChildOf(this.mainBlock)

        this.searchBar = new SearchElement(this)

        this.handler.draw(this.mainBlock, false)

        if (this.sortCategories) this.config.sort(this.sortCategories)

        this.config.forEach((obj, index) => {
            const categoryName = obj.category

            this.categories.set(
                categoryName,
                new Category(this, categoryName, index === 0).createElementClass._create()
            )
        })

        // See `CreateElement.js` line 75.

        // this.hoverText = new UIWrappedText("")
        //     .setX(new CenterConstraint())
        //     .setY(new CenterConstraint())
        //     .setChildOf(this.handler.getWindow())
        //     .onMouseScroll(() => {
        //         this.hoverText.setText("")
        //         this.hoverText
        //             .setX((-1).pixels())
        //             .setY((-1).pixels())
        //     })
    }

    /**
     * - Checks whether the color scheme exists and if it doesnt it creates
     * a new one using the path and the default color scheme from the module
     * @param {string} moduleName
     * @param {string} path
     * @returns {object}
     */
    _checkScheme(path) {
        const mainDefaultScheme = JSON.parse(FileLib.read("DocGuiLib", "data/DefaultColors.json"))
        let defaultScheme = JSON.parse(FileLib.read("Amaterasu", "data/_DefaultScheme.json"))
        let colorScheme = JSON.parse(FileLib.read(this.moduleName, path)) ?? defaultScheme

        if (colorScheme?.Amaterasu?.backgroundBox) {
            const oldSchemePath = `${path.replace(/\.json/, "")}_old.json`
            console.warn(`[Amaterasu - ${this.moduleName}] old scheme system detected, your old scheme has been saved as ${oldSchemePath}`)

            this._saveScheme(oldSchemePath, colorScheme)
            // Reset values since we need it to be a clean new object
            colorScheme = {}
        }

        defaultScheme = mergeObjects(defaultScheme, mainDefaultScheme)
        colorScheme = mergeObjects(colorScheme, defaultScheme)

        this._saveScheme(path, colorScheme)

        return colorScheme
    }

    /**
     * - Checks whether it should hide the previous category or not
     * this is to prevent them both being rendered at the same time
     */
    _checkCategories() {
        let selectedAmount = 0

        this.categories.forEach((value, key) => {
            // Ensure that the amount of selected components variables
            // set to true is more than 1
            if (value.selected) selectedAmount++
            if (selectedAmount < 1) return

            // Gets the old category's class to disable it
            const oldCategoryClass = this.categories.get(this.oldCategory)

            // Disable the old category (aka just hide it)
            oldCategoryClass._setSelected(false)
            this.searchBar._hide()

            // Set this key as the old category
            this.oldCategory = key
            // Reset to default values
            selectedAmount = 0
        })
    }

    /**
     * - Hides all of the categories
     * - Currently only used by [SearchBar]
     */
    _hideAll() {
        this.categories.forEach(value => {
            value._setSelected(false)
        })

        this.searchBar._addSlider()
    }

    /**
     * - Unhides the previously selected category
     * - Currently only used by [SearchBar]
     */
    _unhideAll() {
        this.categories.get(this.currentCategory)._setSelected(true)

        this.searchBar.searchBar.textInput.releaseWindowFocus()
        this.searchBar._removeSlider()

        this.apply()
    }

    /**
     * - Saves the json color scheme into the given path
     * @param {String} path
     * @param {Object} json
     */
    _saveScheme(path, json) {
        FileLib.write(
            this.moduleName,
            path,
            JSON.stringify(json, null, 4),
            true
        )
    }
}