import ElementUtils from "../../DocGuiLib/core/Element"
import Button1Element from "../../DocGuiLib/elements/Button1"
import ButtonElement from "../../DocGuiLib/elements/Button"
import CheckboxElement from "../../DocGuiLib/elements/Checkbox"
import SliderElement from "../../DocGuiLib/elements/Slider"
import SelectionElement from "../../DocGuiLib/elements/Selection"
import TextDescriptionElement from "../../DocGuiLib/elements/TextDescription"
import TextInputElement from "../../DocGuiLib/elements/TextInput"
import ColorPickerElement from "../../DocGuiLib/elements/ColorPicker"
import { CenterConstraint, CramSiblingConstraint, ScrollComponent, SiblingConstraint, UIRoundedRectangle } from "../../Elementa"
import ConfigTypes from "./ConfigTypes"

export default class Category {
    /**
     * @param {Settings} parentClass
     */
    constructor(parentClass, categoryName, selected = false) {
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
        // This map holds all of the buttons created
        // this is to ensure the user can use their own function for the click method it
        this.buttonsFn = new Map()

        this.rightBlock = new ScrollComponent("no elements", 5.0)
            .setX((1).pixel())
            .setY((1).pixel())
            .setWidth((100).percent())
            .setHeight((100).percent())
            .setChildOf(this.mainRightBlock)

        // Adding side button with the category name into the sidebar
        this.sidebarButton = new Button1Element(this.categoryName, 0, 0, 80, 8)
            ._setPosition(
                (1).pixel(),
                new SiblingConstraint()
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
            
            return
        }

        this.rightBlock.unhide(true)
        this.rightBlock.scrollToTop(true)

        this.parentClass.currentCategory = this.categoryName
        if (!this.parentClass.oldCategory) this.parentClass.oldCategory = this.categoryName
    }

    _makeTextDescription(string, description) {
        const bgBox = new UIRoundedRectangle(3)
            .setX((1).pixel())
            .setY(new CramSiblingConstraint(5))
            .setWidth((85).percent())
            .setHeight((20).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.textDescriptionBg))
            .setChildOf(this.rightBlock)

        new TextDescriptionElement(string, description, false, 0, 0, 80, 75)
            ._setPosition(
                (3).pixel(),
                new CenterConstraint()
            )
            ._create(this.handler.getColorScheme())
            .setChildOf(bgBox)

        return bgBox
    }

    _create() {
        const configCategory = this.config.find(obj => obj.category === this.categoryName)

        if (!configCategory) return

        const configSettings = configCategory.settings

        configSettings.forEach(obj => {
            const { name, text, description, type, defaultValue, value } = obj

            switch (type) {
                case ConfigTypes.TOGGLE:
                    this._addToggle(value, text, description, () => {
                        obj.value = !obj.value
                    })
                    break

                case ConfigTypes.SLIDER:
                    this._addSlider(defaultValue, value, text, description, (sliderValue) => {
                        if (typeof(sliderValue) !== "number" || !this.selected) return
        
                        obj.value = sliderValue
                    })
                    break

                case ConfigTypes.BUTTON:
                    this._addButton(name, text, description)
                    break

                case ConfigTypes.SELECTION:
                    this._addSelection(defaultValue, value, text, description, (selectionIndex) => {
                        if (typeof(selectionIndex) !== "number" || !this.selected) return

                        obj.value = selectionIndex
                    })
                    break

                case ConfigTypes.TEXTINPUT:
                    this._addTextInput(value, text, description, (inputText) => {
                        if (!this.selected) return

                        obj.value = inputText
                    })
                    break

                case ConfigTypes.COLORPICKER:
                    this._addColorPicker(value, text, description, ([r, g, b]) => {
                        if (!this.selected) return

                        obj.value = [r, g, b]
                    })
                    break
            
                default:
                    break
            }
        })

        return this
    }

    _addToggle(toggle = false, string, description, fn) {
        const textDescription = this._makeTextDescription(string, description)
            
        new CheckboxElement(toggle, 0, 0, 12, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onMouseClickEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    _addSlider(defaultValues = [], values, string, description, fn) {
        const textDescription = this._makeTextDescription(string, description)

        new SliderElement(defaultValues, values, 0, 0, 15, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onMouseReleaseEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    _addSelection(defaultValues = [], values, string, description, fn) {
        const textDescription = this._makeTextDescription(string, description)

        new SelectionElement(defaultValues, values, 0, 0, 17, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onMouseClickEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    _addTextInput(value, string, description, fn) {
        const textDescription = this._makeTextDescription(string, description)

        new TextInputElement(value, 0, 0, 17, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onKeyTypeEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    _addColorPicker(value, string, description, fn) {
        const textDescription = this._makeTextDescription(string, description)

        new ColorPickerElement(value, 0, 0, 17, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onKeyTypeEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    /**
     * - Makes a button with title and description
     * @param {String} name 
     * @param {String} string 
     * @param {String} description 
     * @returns this for method chaining
     */
    _addButton(name, string, description) {
        const textDescription = this._makeTextDescription(string, description)

        // Making a variable for it so we can further more change this element
        // and also add it to the [Map]
        const button = new ButtonElement("Click", 0, 0, 15, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )

        button
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        // Adding this button to the map so the user can use [onClick] method
        this.buttonsFn.set(name, button)

        return this
    }
}