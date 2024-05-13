import ElementUtils from "../../DocGuiLib/core/Element"
import HandleGui from "../../DocGuiLib/core/Gui"
import MarkdownElement from "../../DocGuiLib/elements/Markdown"
import SearchElement from "./Search"
import { CenterConstraint, CramSiblingConstraint, ScrollComponent, UIRoundedRectangle, UIText, UIWrappedText } from "../../Elementa"
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
    constructor(moduleName, configPath, colorSchemePath, defaultConfig, titleText, sortCategories) {
        // Module variables
        this.moduleName = moduleName
        this.configPath = configPath
        this.defaultConfig = defaultConfig
        this.colorScheme = this._checkScheme(colorSchemePath)

        //
        this.handler = new HandleGui()._setColorScheme(this.colorScheme)
        this.titleText = titleText?.replace("&&", "§") ?? `${this.moduleName} Settings`
        this.sortCategories = null
        this.sortElements = null

        // TODO: change the method name
        // also finish this feature because currently it does a whole lot of nothing
        if (sortCategories) console.warn(`[Amaterasu] Sorting categories parameter has been depricated. since it was found that you have set it to true a normal sorting function has been set, change this by adding your own function with the method #setSortingCategories`)

        // Config variables
        this.configsClass = new Configs(this.moduleName, this.configPath, this.defaultConfig)
        this.config = this.configsClass.config
        this.settings = this.configsClass._normalizeSettings()

        // Categories variables
        this.categories = new Map()
        this.currentCategory = null
        this.oldCategory = null

        // Init function
        this._init()
    }

    /**
     * - Sets the command to open this gui
     * @param {String} name 
     * @returns this for method chaining
     */
    setCommand(name) {
        this.handler.setCommand(name)

        return this
    }

    /**
     * - Function to be ran whenever the config gui attempts to sort the categories
     * - The category names are passed through the function
     * - NOTE: this function should return [-1, 0, 1]
     * @param {Function} fn 
     * @returns this for method chaining
     */
    setCategorySort(fn) {
        if (typeof(fn) !== "function") throw new Error(`[Amaterasu - #setCategorySort] ${fn} is not a valid function`)
        this.sortCategories = fn
        this._reloadWindow()

        return this
    }

    setSortElements(fn) {
        if (typeof(fn) !== "function") throw new Error(`[Amaterasu - #setSortElements] ${fn} is not a valid function`)

        this.sortElements = fn
        this._reloadWindow()

        return this
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

    _init() {
        this.mainBlock = new UIRoundedRectangle(3)
            .setX((20).percent())
            .setY((20).percent())
            .setWidth((65).percent())
            .setHeight((50).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.backgroundBox))

        this.title = new UIText(this.titleText)
            .setX(new CenterConstraint())
            .setY((3).percent())
            .setChildOf(this.mainBlock)

        this.leftBlock = new ScrollComponent("no elements", 5.0)
            .setX((3).pixel())
            .setY((7).percent())
            .setWidth((18).percent())
            .setHeight((90).percent())
            .setChildOf(this.mainBlock)

        this.mainRightBlock = new UIRoundedRectangle(3)
            .setX((3).pixel(true))
            .setY((7).percent())
            .setWidth((78).percent())
            .setHeight((90).percent())
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
            .setChildOf(this.mainBlock)

        this.searchBar = new SearchElement(this)

        this.handler.draw(this.mainBlock, false)

        if (this.sortCategories) this.config.sort((a, b) => this.sortCategories(a.category, b.category))

        this.config.forEach((obj, index) => {
            const categoryName = obj.category

            this.categories.set(
                categoryName,
                new Category(this, categoryName, index === 0).createElementClass._create()
                )
        })

        this.hoverText = new UIWrappedText("")
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setChildOf(this.handler.getWindow())
            .onMouseScroll(() => {
                this.hoverText.setText("")
                this.hoverText
                    .setX((-1).pixels())
                    .setY((-1).pixels())
            })
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
     * - Clears the childen of the current window and re-builds it
     */
    _reloadWindow() {
        this.handler.getWindow().clearChildren()
        this._init()

        if (this.changelogText) this.addChangelog(this.changelogText)
    }

    /**
     * - Triggers this function whenever the given button's feature is clicked
     * @param {String} categoryName 
     * @param {String} featureName 
     * @param {Function} fn 
     * @returns this for method chaining
     */
    onClick(categoryName, featureName, fn) {
        this.categories.get(categoryName).createElementClass.buttonsFn.get(featureName).onMouseClickEvent(fn)
        this.searchBar._setClick(featureName, fn)

        return this
    }

    /**
     * - Creates and adds an element with the given params into the [JSON] file
     * @param {String} categoryName 
     * @param {String} configName The config name to use for settings
     * @param {String} text The text to display for this element
     * @param {String} description The description to display for this element
     * @param {ConfigType} type The config type of this element
     * @param {*} defaultValue 
     * @param {*} value 
     * @param {String} hideFeatureName The feature name that should be enabled for this element to unhide
     * @param {Boolean} overWrite Whether it should overwrite the setting if it's found in the [JSON] or not (false by default)
     * @returns this for method chaining
     */
    addElement(categoryName, configName, text, description, type, defaultValue, value = null, hideFeatureName = null, overWrite = false) {
        const categoryObj = this.config.find(obj => obj.category === categoryName)

        if (!categoryObj || !overWrite && categoryObj.settings.some(obj => obj.name === configName)) return this

        categoryObj.settings.push({
            name: configName,
            text: text,
            description: description,
            type: type,
            defaultValue: defaultValue,
            value: value ?? defaultValue,
            hideFeatureName: hideFeatureName
        })

        this._reloadWindow()

        return this
    }

    /**
     * - Removes an element that matches the given params
     * @param {String} categoryName 
     * @param {String} configName 
     * @returns this for method chaining
     */
    removeElement(categoryName, configName) {
        const categoryObj = this.config.find(obj => obj.category === categoryName)

        if (!categoryObj || !categoryObj.settings.some(obj => obj.name === configName)) return this

        categoryObj.settings.forEach((obj, index) => {
            if (obj.name !== configName) return

            categoryObj.settings.splice(index, 1)
        })

        this._reloadWindow()

        return this
    }

    /**
     * - Hides all of the categories
     * - Currently only used by [SearchBar]
     */
    _hideAll() {
        this.categories.forEach(value => {
            value._setSelected(false)
        })
    }

    /**
     * - Unhides the previously selected category
     * - Currently only used by [SearchBar]
     */
    _unhideAll() {
        this.categories.get(this.currentCategory)._setSelected(true)

        this.searchBar.searchBar.textInput.releaseWindowFocus()
        this._reloadWindow()
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

    /**
     * - Adds a [Changelog] section with the given string
     * @param {String} text 
     * @returns this for method chaining
     */
    addChangelog(text) {
        if (text instanceof Array) text = text.join("\n")
        this.changelogText = text

        const changelogCategory = new Category(this, "Changelog", false, false)
        new MarkdownElement(text, 0, 0, 85, 85)
            ._setPosition(
                (1).pixel(),
                new CramSiblingConstraint(5)
            )
            ._create(this.handler.getColorScheme())
            .setChildOf(changelogCategory.rightBlock)

        this.categories.set("Changelog", changelogCategory)

        return this
    }
}