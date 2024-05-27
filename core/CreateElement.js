import ElementUtils from "../../DocGuiLib/core/Element"
import ButtonElement from "../../DocGuiLib/elements/Button"
import CheckboxElement from "../../DocGuiLib/elements/Checkbox"
import SliderElement from "../../DocGuiLib/elements/Slider"
import SelectionElement from "../../DocGuiLib/elements/Selection"
import TextDescriptionElement from "../../DocGuiLib/elements/TextDescription"
import TextInputElement from "../../DocGuiLib/elements/TextInput"
import ColorPickerElement from "../../DocGuiLib/elements/ColorPicker"
import SwitchElement from "../../DocGuiLib/elements/Switch"
import DropDown from "../../DocGuiLib/elements/DropDown"
import MultiCheckbox from "../../DocGuiLib/elements/MultiCheckbox"
import Keybind from "../../DocGuiLib/elements/Keybind"
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

        const textWidth = obj.type === ConfigTypes.COLORPICKER
            ? 75
            : obj.type === ConfigTypes.TEXTPARAGRAPH
                ? 98
                : 80

        const descElement = new TextDescriptionElement(obj.text, obj.description, obj.centered ?? false, 0, 0, textWidth, 75)
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
                        // Trigger listeners
                        this._triggerListeners(obj, !obj.value)

                        obj.value = !obj.value
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.SLIDER:
                    this._addSlider(obj, (sliderValue) => {
                        if (typeof(sliderValue) !== "number" || !this.categoryClass.selected) return
                        // Trigger listeners
                        this._triggerListeners(obj, sliderValue)
        
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
                        // Trigger listeners
                        this._triggerListeners(obj, selectionIndex)

                        obj.value = selectionIndex
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.TEXTINPUT:
                    this._addTextInput(obj, (inputText) => {
                        if (!this.categoryClass.selected) return
                        // Trigger listeners
                        this._triggerListeners(obj, inputText)

                        obj.value = inputText
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.COLORPICKER:
                    this._addColorPicker(obj, ([r, g, b, a]) => {
                        if (!this.categoryClass.selected) return
                        // Trigger listeners
                        this._triggerListeners(obj, [r, g, b, a])

                        obj.value = [r, g, b, a]
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.SWITCH:
                    this._addSwitch(obj, () => {
                        // Trigger listeners
                        this._triggerListeners(obj, !obj.value)

                        obj.value = !obj.value
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.DROPDOWN:
                    this._addDropDown(obj, (value) => {
                        // Trigger listeners
                        this._triggerListeners(obj, value)

                        obj.value = value
                        this.categoryClass._reBuildConfig()
                    })
                    break

                case ConfigTypes.MULTICHECKBOX:
                    this._addMultiCheckbox(obj, (configName, value) => {
                        const idx = obj.options.findIndex(it => it.configName === configName)
                        if (idx === -1) return
                        // Trigger listeners
                        this._triggerListeners(obj.options[idx], value)

                        obj.options[idx].value = value
                        this.categoryClass._reBuildConfig()
                    })

                    break

                case ConfigTypes.TEXTPARAGRAPH:
                    this._makeTextDescription(obj)

                    break

                case ConfigTypes.KEYBIND:
                    this._addKeybind(obj, (value) => {
                        // Trigger listeners
                        this._triggerListeners(obj, value)

                        obj.value = value
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

    _triggerListeners(obj, newvalue) {
        const _configListeners = this.categoryClass.parentClass._configListeners

        _configListeners.get(obj.name)?.forEach(it => it(obj.value, newvalue))
        if (obj.registerListener) obj.registerListener(obj.value, newvalue)
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

        // Making a variable for it so we can set the [onMouseClickEvent] later on
        const button = new ButtonElement(obj.placeHolder, 0, 0, 15, 30, true)
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

    _addDropDown(obj, fn) {
        const textDescription = this._makeTextDescription(obj)
            
        const component = new DropDown(obj.options, obj.value, 0, 0, 20, 35)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onMouseClickEvent(fn)

        component
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        this.rightBlock
            .onMouseScroll(() => {
                if (component.hidden) return

                component._hideDropDown()
            })
            .onMouseClick(() => {
                if (component.hidden) return

                component._hideDropDown()
            })

        return this
    }

    _addMultiCheckbox(obj, fn) {
        const textDescription = this._makeTextDescription(obj)
            
        const component = new MultiCheckbox(obj.options, obj.placeHolder, 0, 0, 20, 35)
            ._setPosition(
                (5).pixel(true),
                new CenterConstraint()
            )
            .onMouseClickEvent(fn)

        component
            ._create(this.handler.getColorScheme())
            .setChildOf(textDescription)

        this.rightBlock
            .onMouseScroll(() => {
                if (component.hidden) return

                component._hideDropDown()
            })
            .onMouseClick(() => {
                if (component.hidden) return

                component._hideDropDown()
            })

        return this
    }

    _addKeybind(obj, fn) {
        const textDescription = this._makeTextDescription(obj)

        new Keybind(obj.value, 0, 0, 15, 30)
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