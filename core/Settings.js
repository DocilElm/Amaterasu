import ElementUtils from "../../DocGuiLib/core/Element"
import HandleGui from "../../DocGuiLib/core/Gui"
import MarkdownElement from "../../DocGuiLib/elements/Markdown"
import SearchElement from "./Search"
import { CenterConstraint, CramSiblingConstraint, OutlineEffect, ScrollComponent, UIRoundedRectangle, UIText, UIWrappedText } from "../../Elementa"
import Category from "./Category"
import Configs from "./Config"

// I know this is a very bad solution but
// honestly i don't want to further more bother
// with this dumb thing
const customAssignObject = (obj1, obj2) => {
    /**
     specifically made for an object like this:
     {
        "Button": {
            "backgroundBox": [0, 0, 0, 80],
            "backgroundBox1": [0, 0, 0, 0],
            "lines": [0, 0, 0, 80],
            "textColor": [255, 255, 255, 255],
            "textColorSelected": [19, 117, 141, 255],
            "textScale": 1,
            "mouseClick": [255, 255, 255, 80],
            "mouseEnter": [0, 0, 0, 80],
            "mouseLeave": [0, 0, 0, 0]
        }
    }
     */
    Object.keys(obj2).forEach(key => {
        // If the [key] doesn't exist in the first object
        // we assign an object into it
        if (!obj1[key]) obj1[key] = {}

        Object.keys(obj2[key]).forEach(key2 => {
            // If the [key] exist in the first object
            // we return
            if (obj1[key][key2]) return

            // Else we add the second object's value into it
            obj1[key][key2] = obj2[key][key2]
        })

    })

    // return the edited object
    return obj1
}

export default class Settings {
    constructor(moduleName, defaultConfig, colorSchemePath, titleText) {
        // Module variables
        this.moduleName = moduleName
        // this.configPath = configPath
        this.defaultConfig = defaultConfig
        this.colorScheme = this._checkScheme(colorSchemePath)

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
                // Trigger listeners
                this._onCloseGui.forEach(it => it())

                if (Client.getMinecraft().field_71474_y.field_74335_Z !== 2 || this.GuiScale == null) return
                if (this.GuiScale === 2) return

                Client.getMinecraft().field_71474_y.field_74335_Z = this.GuiScale
                this.GuiScale = null
            })

        // Config variables
        this.configsClass = new Configs(this.defaultConfig)
        this.config = this.configsClass.config
        this.settings = this.configsClass._normalizeSettings()

        // Categories variables
        this.categories = new Map()
        this.currentCategory = null
        this.oldCategory = null
        this.markdowns = []

        // Drawing variables
        this.bgPos = {
            x: (20).percent(),
            y: (20).percent()
        }
        this.bgSize = {
            width: (60).percent(),
            height: (50).percent()
        }

        // Init function
        this._init()
    }

    /**
     * - Sets the command to open this gui
     * @param {String} name 
     * @param {String[]} aliases
     * @returns this for method chaining
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
     * @param {Function} fn 
     * @returns this for method chaining
     */
    setCategorySort(fn) {
        if (typeof(fn) !== "function") throw new Error(`${fn} is not a valid function`)
        this.sortCategories = fn

        return this
    }

    /**
     * - Function to be ran whenever [CreateElement] attempts to sort the config components
     * - The object is passed through the function
     * - (e.g "obj" would be a param so you can then do "obj.text" for its text)
     * - NOTE: this function should return [-1, 0, 1]
     * @param {Function} fn 
     * @returns this for method chaining
     */
    setElementSort(fn) {
        if (typeof(fn) !== "function") throw new Error(`${fn} is not a valid function`)
        this.sortElements = fn

        return this
    }

    /**
     * - Sets the starting x and y value of the gui (in percent)
     * @param {Number} x 
     * @param {Number} y 
     * @returns this for method chaining
     */
    setPos(x, y) {
        this.bgPos.x = (x).percent()
        this.bgPos.y = (y).percent()
        
        return this
    }

    /**
     * - Sets the width and height of the gui (in percent)
     * @param {Number} width 
     * @param {Number} height 
     * @returns this for method chaining
     */
    setSize(width, height) {
        this.bgSize.width = (width).percent()
        this.bgSize.height = (height).percent()
        
        return this
    }

    /**
     * @param {String} colorSchemePath 
     * @returns this for method chaining
     */
    setScheme(newPath) {
        this.colorSchemePath = newPath

        this.colorScheme = this._checkScheme(this.colorSchemePath)
        this.handler._setColorScheme(this.colorScheme)

        return this
    }

    /**
     * - Adds a [Changelog] section with the given string
     * - Equivalent to `.addMarkdown("Changelog", text)`
     * @param {String} text 
     * @returns this for method chaining
     */
    addChangelog(text) {
        return this.addMarkdown("Changelog", text)
    }

    /**
     * - Adds a markdown category
     * @param {String} category
     * @param {String|String[]} text 
     * @returns this for method chaining
     */
    addMarkdown(category, text, _internal = false) {
        if (text instanceof Array) text = text.join("\n")

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
     * - Triggers the given function whenever this [GUI] is opened
     * @param {Function} fn 
     * @returns this for method chaining
     */
    onOpenGui(fn) {
        if (typeof(fn) !== "function") throw new Error(`${fn} is not a valid function.`)

        this._onOpenGui.push(fn)

        return this
    }

    /**
     * - Triggers the given function whenever this [GUI] is closed
     * @param {Function} fn 
     * @returns this for method chaining
     */
    onCloseGui(fn) {
        if (typeof(fn) !== "function") throw new Error(`${fn} is not a valid function.`)

        this._onCloseGui.push(fn)

        return this
    }

    /**
     * - Runs the given function whenever the configName changes value
     * - the function will recieve the args `(previousValue, newValue)`
     * @param {String} configName 
     * @param {Function} fn 
     * @returns this for method chaining
     */
    registerListener(configName, fn) {
        if (!configName) throw new Error(`${configName} is not a valid config name.`)
        if (typeof(fn) !== "function") throw new Error(`${fn} is not a valid function.`)

        if (!this._configListeners.has(configName)) this._configListeners.set(configName, [])

        this._configListeners.get(configName).push(fn)

        return this
    }
    
    /**
     * - Redirects the current category to the given one
     * - if a `featureName` was given it will try to find it and scroll towards it
     * @param {String} categoryName 
     * @param {String?} featureName 
     * @returns this for method chaining
     */
    redirect(categoryName, featureName = null) {
        const categoryInstance = this.categories.get(categoryName)
        if (!categoryInstance) throw new Error(`${categoryName} is not a valid category name.`)
        
        // Reset the state of all the categories
        this.categories.forEach(value => value._setSelected(false))

        // Set the new category's state
        this.oldCategory = null
        this.currentCategory = categoryName

        // Update the state of the given categoryName
        this.categories.get(this.currentCategory)._setSelected(true)

        if (featureName) {
            Client.scheduleTask(2, () => {
                const rightBlock = categoryInstance.rightBlock
                const comp = categoryInstance.createElementClass.elements.get(featureName)?.component
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
     * @returns this for method chaining
     */
    apply() {
        this.oldCategory = null
        this.categories.forEach(value => value._setSelected(false))
        this.handler.getWindow().clearChildren()
        this._init()

        this.markdowns.forEach(md => this.addMarkdown(...md, true))

        return this
    }

    _init() {
        this.mainBlock = new UIRoundedRectangle(5)
            .setX(this.bgPos.x)
            .setY(this.bgPos.y)
            .setWidth(this.bgSize.width)
            .setHeight(this.bgSize.height)
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.backgroundBox))
            .enableEffect(new OutlineEffect(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.mainBgBoxOutline), this.handler.getColorScheme().Amaterasu.mainBgBoxOutlineThickness))

        this.title = new UIText(this.titleText)
            .setX(new CenterConstraint())
            .setY((3).percent())
            .setTextScale((this.handler.getColorScheme().Amaterasu.mainTitleTextScale).pixels())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.mainTitleTextColor))
            .setChildOf(this.mainBlock)

        this.searchBarBg = new UIRoundedRectangle(3)
            .setX((68.4).percent())
            .setY((1.5).percent())
            .setWidth((15).percent())
            .setHeight((5).percent())
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
            .setChildOf(this.mainBlock)

        this.topLine = new UIRoundedRectangle(3)
            .setX((0.5).percent())
            .setY(new CramSiblingConstraint(5))
            .setWidth((99).percent())
            .setHeight((this.handler.getColorScheme().Amaterasu.topLineSize).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.topLine))
            .setChildOf(this.mainBlock)

        this.leftBlockBg = new UIRoundedRectangle(3)
            .setX((0.75).percent())
            .setY(new CramSiblingConstraint(5))
            .setWidth((18).percent())
            .setHeight((87).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.leftPanelBg))
            .setChildOf(this.mainBlock)

        this.leftBlock = new ScrollComponent("no elements", 5.0)
            .setX((1).percent())
            .setY((1).percent())
            .setWidth((98).percent())
            .setHeight((98).percent())
            .setChildOf(this.leftBlockBg)

        this.leftBlockScrollbar = new UIRoundedRectangle(3)
            .setX((3).pixels(true))
            .setWidth((5).pixels())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.scrollbar))
            .setChildOf(this.leftBlockBg)

        this.leftBlock.setScrollBarComponent(this.leftBlockScrollbar, true, false)

        this.mainRightBlock = new UIRoundedRectangle(3)
            .setX(new CramSiblingConstraint(5))
            .setY(new CramSiblingConstraint(5))
            .setWidth((70).percent())
            .setHeight((87).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.rightPanelBg))
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
     * @param {String} moduleName 
     * @param {String} path 
     * @returns {Object}
     */
    _checkScheme(path) {
        let defaultScheme = JSON.parse(FileLib.read("Amaterasu", "data/ColorScheme.json"))
        const mainDefaultScheme = JSON.parse(FileLib.read("DocGuiLib", "data/DefaultColors.json"))
        let colorScheme = JSON.parse(FileLib.read(this.moduleName, path)) ?? {}

        defaultScheme = customAssignObject(defaultScheme, mainDefaultScheme)
        colorScheme = customAssignObject(colorScheme, defaultScheme)
        
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