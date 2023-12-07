import ElementUtils from "../../DocGuiLib/core/Element"
import HandleGui from "../../DocGuiLib/core/Gui"
import { CenterConstraint, ScrollComponent, UIRoundedRectangle, UIText } from "../../Elementa"
import Category from "./Category"
import Configs from "./Config"

export default class Settings {
    constructor(moduleName, configPath, colorSchemePath, defaultConfig) {
        this.moduleName = moduleName
        this.configPath = configPath
        this.defaultConfig = defaultConfig
        this.handler = new HandleGui(colorSchemePath, this.moduleName)

        // Config variables
        this.configsClass = new Configs(this.moduleName, this.configPath, this.defaultConfig)
        this.config = this.configsClass.config
        this.settings = this.configsClass._normalizeSettings()

        // Categories variables
        this.categories = new Map()
        this.currentCategory = null
        this.oldCategory = null

        // Init functions
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

    _init() {
        this.mainBlock = new UIRoundedRectangle(3)
            .setX((20).percent())
            .setY((20).percent())
            .setWidth((65).percent())
            .setHeight((50).percent())
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 80]))

        this.title = new UIText("§aSettings")
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

        this.handler.draw(this.mainBlock, false)

        this.config.forEach((obj, index) => {
            const categoryName = obj.category

            this.categories.set(
                categoryName,
                new Category(this, categoryName, index === 0)
                    ._create()
                )
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
    onClick(categoryName, featureName, fn) {
        this.categories.get(categoryName).buttonsFn.get(featureName).onMouseClickEvent(fn)

        return this
    }
}