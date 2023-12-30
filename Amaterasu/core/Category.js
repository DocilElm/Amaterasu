import ElementUtils from "../../DocGuiLib/core/Element"
import Button1Element from "../../DocGuiLib/elements/Button1"
import DividerElement from "../../DocGuiLib/elements/Divider"
import { Animations, ConstantColorConstraint, CramSiblingConstraint, ScrollComponent, SiblingConstraint, animate } from "../../Elementa"
import CreateElement from "./CreateElement"

export default class Category {
    /**
     * @param {Settings} parentClass
     */
    constructor(parentClass, categoryName, selected = false, shouldCreate = true) {
        this.parentClass = parentClass
        this.categoryName = categoryName

        this.handler = this.parentClass.handler
        this.leftBlock = this.parentClass.leftBlock
        this.mainBlock = this.parentClass.mainBlock
        this.mainRightBlock = this.parentClass.mainRightBlock
        this.config = this.parentClass.config

        // This is used to know if this category
        // is the one currently being selected
        this.selected = selected

        this.rightBlock = new ScrollComponent("", 5.0)
            .setX((1).pixel())
            .setY((1).pixel())
            .setWidth((100).percent())
            .setHeight((100).percent())
            .setChildOf(this.mainRightBlock)

        new DividerElement(this.categoryName, 0, 0, 85, 5)
            ._setPosition(
                (1).pixel(),
                new CramSiblingConstraint(5)
            )
            ._create(this.handler.getColorScheme())
            .setChildOf(this.rightBlock)

        // Adding side button with the category name into the sidebar
        this.sidebarButton = new Button1Element(this.categoryName, 0, 0, 80, 8)
            ._setPosition(
                (1).pixel(),
                new SiblingConstraint(1)
            )
            .onMouseClickEvent(() => {
                // Avoid hiding this element incase it's the only one being shown
                if (this.parentClass.currentCategory && this.parentClass.currentCategory === this.categoryName) return

                this._setSelected(true)
                this.parentClass._checkCategories()
            })
        
        this.sidebarButton
            ._create(this.handler.getColorScheme())
            .setChildOf(this.leftBlock)

        // Hide/Unhides this category from the main block
        this._refresh()
        // Creat the elements for this gui based off of the [JSON] file
        if (shouldCreate) this.createElementClass = new CreateElement(this)
    }

    /**
     * - Sets the current [selected] variable for this [Category]
     * @param {Boolean} toggle 
     * @returns this for method chaining
     */
    _setSelected(toggle = false) {
        this.selected = toggle
        this._refresh()

        return this
    }

    _refresh() {
        if (!this.selected) {
            this.rightBlock.hide(true)
            this.rightBlock.loseFocus()
            this.sidebarButton.text.setColor(this.sidebarButton._getColor("textColor"))
            
            return
        }

        this.rightBlock.unhide(true)
        this.rightBlock.scrollToTop(true)
        this.sidebarButton.text.setColor(this.sidebarButton._getColor("textColorSelected"))

        this.parentClass.currentCategory = this.categoryName
        if (!this.parentClass.oldCategory) this.parentClass.oldCategory = this.categoryName
    }

    /**
     * - Re-builds the normalize settings
     * @returns this for method chaining
     */
    _reBuildConfig() {
        this.parentClass.settings = this.parentClass.configsClass._normalizeSettings()
        this.createElementClass._hideElement()

        return this
    }
}