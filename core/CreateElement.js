import ElementUtils from "../../DocGuiLib/core/Element"
import ButtonElement from "../../DocGuiLib/elements/Button"
import CheckboxElement from "../../DocGuiLib/elements/Checkbox"
import SliderElement from "../../DocGuiLib/elements/Slider"
import SelectionElement from "../../DocGuiLib/elements/Selection"
import TextDescriptionElement from "../../DocGuiLib/elements/TextDescription"
import TextInputElement from "../../DocGuiLib/elements/TextInput"
import ColorPickerElement from "../../DocGuiLib/elements/ColorPicker"
import SwitchElement from "../../DocGuiLib/elements/Switch"
import { CenterConstraint, CramSiblingConstraint, OutlineEffect, UIRoundedRectangle } from "../../Elementa"
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
        this.sortElement = this.categoryClass.parentClass.sortElements

        // This map holds all of the elements
        this.elements = new Map()

        // Stores all the created [subcategories]
        // maybe later on we store the actual settings of each
        this.subcategories = new Set()
    }

    /**
     * - Makes a text with description element and adds it to the list of elements
     * and returns the box itself to be used as parent
     * @param {Object} obj 
     * @returns
     */
    _makeTextDescription(obj) {
        const subcategory = obj.subcategory ?? this.categoryClass.categoryName

        if (!this.subcategories.has(subcategory)) {
            this.subcategories.add(subcategory)
            this.categoryClass?._createDivider(subcategory, this.subcategories.size > 1)
        }

        const bgBox = new UIRoundedRectangle(5)
            .setX(new CenterConstraint())
            .setY(new CramSiblingConstraint(5))
            .setWidth((85).percent())
            .setHeight((20).percent())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.textDescriptionBg))
            .enableEffect(new OutlineEffect(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.elementsDescriptionOutline), this.handler.getColorScheme().Amaterasu.elementsDescriptionOutlineThickness))
            .setChildOf(this.rightBlock)

        const descElement = new TextDescriptionElement(obj.text, obj.description, false, 0, 0, obj.type === ConfigTypes.COLORPICKER ? 75 : 80, 75)
            ._setPosition(
                (3).pixel(),
                new CenterConstraint()
            )
        descElement
            ._create(this.handler.getColorScheme())
            .setChildOf(bgBox)
            .onMouseEnter((component) => {
                // Checks the boundaries of the [rightBlock] to not render
                // the text once the component is below the scrollable (meaning the hidden ->) area
                // After this checks whether the text width is above the width
                // if it is, this means that the text will be wrapped so we can
                // render wrapped text only as hover values instead of every single description
                if (!(
                    component.getLeft() > this.rightBlock.getLeft() &&
                    component.getRight() < this.rightBlock.getRight() &&
                    component.getTop() > this.rightBlock.getTop() &&
                    component.getBottom() < this.rightBlock.getBottom()) ||
                    Renderer.getStringWidth(descElement.descriptionElement.getText().removeFormatting()) < bgBox.getWidth()
                ) return

                const hoverText = this.categoryClass.parentClass.hoverText

                hoverText.setText(obj.description)
                hoverText.setX((component.getLeft()).pixels())
                hoverText.setY((descElement.descriptionElement.getTop()).pixels())
                hoverText.setWidth((descElement.descriptionElement.getWidth()).pixels())
            })
            .onMouseLeave(() => {
                const hoverText = this.categoryClass.parentClass.hoverText

                hoverText.setText("")
            })

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

        if (this.sortElement) configSettings.sort(this.sortElement)

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
            }
        })

        // Trigger the hide/unhide of elements
        this._hideElement(this.categoryClass.parentClass.settings)

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

        new SliderElement(obj.options, obj.value, 0, 0, 15, 30)
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

        new SelectionElement(obj.options, obj.value, 0, 0, 17, 30)
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
            .setPlaceHolder(obj.placeHolder)
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

        if (obj.onClick) button.onMouseClickEvent(() => obj.onClick(this.categoryClass.parentClass))

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
    _hideElement(data) {
        this.elements.forEach(obj => {
            if (!obj.configObj.shouldShow) return

            const isEnabled = obj.configObj.shouldShow(data)
            const component = obj.component

            if (typeof(isEnabled) !== "boolean") throw new Error(`Error while attempting to check for shouldShow. ${obj.configObj.shouldShow} does not return a valid Boolean`)

            if (!isEnabled) return component.hide()

            component.unhide(true)
        })
    }
}