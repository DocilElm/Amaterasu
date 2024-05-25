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
        // Store these so whenever we [apply] we can
        // add them back to the buttons
        this._onClickList = new Map()

        this.GuiScale = null

        this.handler.registers
            .onOpen(() => {
                if (Client.getMinecraft().field_71474_y.field_74335_Z === 2) return

                // Save previous [GuiScale]
                this.GuiScale = Client.getMinecraft().field_71474_y.field_74335_Z
                // Set [Normal] [GuiScale]
                Client.getMinecraft().field_71474_y.field_74335_Z = 2
            })
            .onClose(() => {
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
    setSortElements(fn) {
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
        this._onClickList.forEach(obj => this.onClick(obj.categoryName, obj.featureName, obj.fn, true))

        return this
    }

    /**
     * @param {String} colorSchemePath 
     * @returns this for method chaining
     */
    changeScheme(newPath) {
        this.colorSchemePath = newPath

        this.colorScheme = this._checkScheme(this.colorSchemePath)
        this.handler._setColorScheme(this.colorScheme)

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
            .setChildOf(this.mainBlock)

        this.searchBarBg = new UIRoundedRectangle(3)
            .setX((69.4).percent())
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
     * - Triggers this function whenever the given button's feature is clicked
     * @param {String} categoryName 
     * @param {String} featureName 
     * @param {Function} fn 
     * @returns this for method chaining
     */
    onClick(categoryName, featureName, fn, _internal = false) {
        const categoryList = this.categories.get(categoryName)
        if (!categoryList) throw new Error(`${categoryName} is not a valid category name.`)

        const btnList = categoryList.createElementClass.buttonsFn.get(featureName)
        if (!btnList) throw new Error(`${featureName} is not a valid feature name.`)

        btnList.onMouseClickEvent(fn)
        this.searchBar._setClick(featureName, fn)

        if (!_internal) {
            this._onClickList.set(categoryName, {
                categoryName,
                featureName,
                fn
            })
        }

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
}