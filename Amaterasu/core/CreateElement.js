import ElementUtils from "../../DocGuiLib/core/Element"
import ButtonElement from "../../DocGuiLib/elements/Button"
import CheckboxElement from "../../DocGuiLib/elements/Checkbox"
import SliderElement from "../../DocGuiLib/elements/Slider"
import SelectionElement from "../../DocGuiLib/elements/Selection"
import TextDescriptionElement from "../../DocGuiLib/elements/TextDescription"
import TextInputElement from "../../DocGuiLib/elements/TextInput"
import ColorPickerElement from "../../DocGuiLib/elements/ColorPicker"
import SwitchElement from "../../DocGuiLib/elements/Switch"
import { CenterConstraint, CramSiblingConstraint, UIRoundedRectangle } from "../../Elementa"
import ConfigTypes from "./ConfigTypes"

export default class CreateElement {
    /**
     * @param {Category} categoryClass
     */
    constructor(categoryClass) {
        // Category class stuff
        this.categoryClass = categoryClass
        this.rightBlock = this.categoryClass.rightBlock
        this.config = this.categoryClass.config
        this.categoryName = this.categoryClass.categoryName
        this.handler = this.categoryClass.handler

        // This map holds all of the elements
        this.elements = new Map()
        // This map holds all of the buttons created
        // this is to ensure the user can use their own function for the click method
        this.buttonsFn = new Map()
    }

    /**
     * - Makes a text with description element and adds it to the list of elements
     * and returns the box itself to be used as parent
     * @param {Object} obj 
     * @returns
     */
    _makeTextDescription(obj) {
        const bgBox = new UIRoundedRectangle(3)
            .setX((1).pixel())
            .setY(new CramSiblingConstraint(5))
            .setWidth((85).percent())
            .setHeight((20).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.textDescriptionBg))
            .setChildOf(this.rightBlock)

        new TextDescriptionElement(obj.text, obj.description, false, 0, 0, 80, 75)
            ._setPosition(
                (3).pixel(),
                new CenterConstraint()
            )
            ._create(this.handler.getColorScheme())
            .setChildOf(bgBox)

        this.elements.set(obj.name, {
            component: bgBox,
            configObj: obj
        })

        return bgBox
    }

    _create() {
        const configCategory = this.categoryClass.config?.find(obj => obj.category === this.categoryName)

        if (!configCategory) return

        const configSettings = configCategory.settings

        configSettings.sort((a, b) => {
            if (a.text < b.text) return -1
            else if (a.text > b.text) return 1
            return 0
        })

        configSettings.forEach(obj => {
            switch (obj.type) {
                case ConfigTypes.TOGGLE:
                    this._addToggle(obj, () => {
                        obj.value = !obj.value
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.SLIDER:
                    this._addSlider(obj, (sliderValue) => {
                        if (typeof(sliderValue) !== "number" || !this.categoryClass.selected) return
        
                        obj.value = sliderValue
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.BUTTON:
                    this._addButton(obj)
                    break

                case ConfigTypes.SELECTION:
                    this._addSelection(obj, (selectionIndex) => {
                        if (typeof(selectionIndex) !== "number" || !this.categoryClass.selected) return

                        obj.value = selectionIndex
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.TEXTINPUT:
                    this._addTextInput(obj, (inputText) => {
                        if (!this.categoryClass.selected) return

                        obj.value = inputText
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.COLORPICKER:
                    this._addColorPicker(obj, ([r, g, b, a]) => {
                        if (!this.categoryClass.selected) return

                        obj.value = [r, g, b, a]
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.SWITCH:
                    this._addSwitch(obj, () => {
                        obj.value = !obj.value
                        this.categoryClass._reBuildConfig()
                    })
                    break
            
                default:
                    break
            }
        })

        // Trigger the hide/unhide of elements
        this._hideElement()

        // Return the parent class for main method chaining
        return this.categoryClass
    }

    _addToggle(obj, fn) {
        const textDescription = this._makeTextDescription(obj)
            
        new CheckboxElement(obj.value, 0, 0, 12, 30, true)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onMouseClickEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    _addSlider(obj, fn) {
        const textDescription = this._makeTextDescription(obj)

        new SliderElement(obj.defaultValue, obj.value, 0, 0, 15, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onMouseReleaseEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    _addSelection(obj, fn) {
        const textDescription = this._makeTextDescription(obj)

        new SelectionElement(obj.defaultValue, obj.value, 0, 0, 17, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onMouseClickEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    _addTextInput(obj, fn) {
        const textDescription = this._makeTextDescription(obj)

        new TextInputElement(obj.value, 0, 0, 17, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onKeyTypeEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    _addColorPicker(obj, fn) {
        const textDescription = this._makeTextDescription(obj)

        new ColorPickerElement(obj.value, 0, 0, 17, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onKeyTypeEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    _addButton(obj) {
        const textDescription = this._makeTextDescription(obj)

        // Making a variable for it so we can further more change this element
        // and also add it to the [Map]
        const button = new ButtonElement("Click", 0, 0, 15, 30, true)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )

        button
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        // Adding this button to the map so the user can use [onClick] method
        this.buttonsFn.set(obj.name, button)

        return this
    }

    _addSwitch(obj, fn) {
        const textDescription = this._makeTextDescription(obj)
            
        new SwitchElement(obj.value, 0, 0, 12, 30)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onMouseClickEvent(fn)
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        return this
    }

    /**
     * - Hides/Unhides the element depending on the Hide Feature's Name param
     */
    _hideElement() {
        this.elements.forEach(obj => {
            if (!obj.configObj.hideFeatureName) return

            const hideFeatureName = obj.configObj.hideFeatureName
            const isEnabled = this.categoryClass.parentClass.settings[hideFeatureName]
            const component = obj.component

            if (typeof(isEnabled) !== "boolean") return

            if (!isEnabled) return component.hide()

            component.unhide(true)
        })
    }
}