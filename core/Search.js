import ElementUtils from "../../DocGuiLib/core/Element"
import TextInputElement from "../../DocGuiLib/elements/TextInput"
import { ScrollComponent, UIRoundedRectangle } from "../../Elementa"
import CreateElement from "./CreateElement"

export default class SearchElement {
    /**
     * 
     * @param {Settings} settingsClass 
     */
    constructor(settingsClass) {
        this.parentClass = settingsClass
        this.handler = this.parentClass.handler
        this.mainRightBlock = this.parentClass.mainRightBlock
        this.mainBlock = this.parentClass.mainBlock
        this.oldConfig = this.parentClass.config
        this.config = {}
        this.categoryName = "SearchBar"

        this.selected = false
        this.sliderAdded = false
        this.matches = null
        this.hasSearched = false
        this.clickFn = new Map()

        this.rightBlock = new ScrollComponent("no elements found", 5.0)
            .setX((1).pixel())
            .setY((1).pixel())
            .setWidth((98).percent())
            .setHeight((98).percent())
            .setChildOf(this.mainRightBlock)

        this.elementsSlider = new UIRoundedRectangle(3)
            .setX((3).pixels(true))
            .setWidth((5).pixels())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.scrollbar))

        this.rightBlock.setScrollBarComponent(this.elementsSlider, true, false)
        this.rightBlock.hide()

        this.searchBar = new TextInputElement("", 0, 0, 100, 100)
            .setPlaceHolder("Search...")
            .onMouseClickEvent(() => this.selected = true)
            .onKeyTypeEvent(this._onKeyType.bind(this))

        this.createElementClass = new CreateElement(this)

        // Whenever [CTRL+F] is typed on the main window enable search
        this.handler.getWindow().onKeyType((_, __, keycode) => {
            if (keycode !== 33 || !Keyboard.isKeyDown(Keyboard.KEY_LCONTROL)) return
            
            this._focusSearch()
        })

        this.searchBar
            ._create(this.handler.colorScheme)
            .setChildOf(this.parentClass.searchBarBg)
    }

    _onKeyType(string) {
        // Return & reset if the focus has been lost
        if (!this.selected) return this._reset()

        // Return & reset if the string is empty and the user has searched before
        if (!string && this.hasSearched) return this._reset()

        // Return if the string is empty so it doesn't try to search for ""
        if (!string) return

        this.config = {}
        this.createElementClass.elements.clear()
        this.createElementClass._create()
        this.rightBlock.clearChildren()

        this.matches = [
            {
                "category": "SearchBar",
                "settings": []
            }
        ]

        this.oldConfig.forEach(mainObj => {

            mainObj.settings.forEach(obj => {
                if (this.matches[0].settings.some(someObj => someObj.name.toLowerCase() === obj.name.toLowerCase())) return

                const matched = obj.text.toLowerCase().includes(string) || obj.description.toLowerCase().includes(string)
                if (!matched) return

                this.matches[0].settings.push(obj)
            })

        })

        // Add the current match length so we can use it on the reset values
        this.hasSearched = true

        this.parentClass._hideAll()
        this.rightBlock.unhide(true)
        this.config = this.matches

        this.createElementClass._create()
        this._checkClicks()
    }

    /**
     * - Resets the current search category and hides it
     * @returns this for method chaining
     */
    _reset() {
        this.rightBlock.hide()
        this.parentClass._unhideAll()
        this.hasSearched = false

        return this
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

    /**
     * - Hides the [rightBlock] component from the [mainRightBlock]
     * and sets this category unselected
     */
    _hide() {
        this.rightBlock.hide()
        this.selected = false
    }

    /**
     * - Checks whether there's a click function for the current button
     * being clicked inside of the search bar [rightBlock] if so add that
     * saved function into the component so it behaves the same way the normal
     * component behaves when given an [onClick] function
     */
    _checkClicks() {
        this.clickFn.forEach((fn, key) => {
            if (!this.createElementClass.buttonsFn.has(key)) return

            this.createElementClass.buttonsFn.get(key).onMouseClickEvent(fn)
        })
    }

    /**
     * - Sets the function to be ran whenever the given [configName] button is clicked
     * @param {String} configName 
     * @param {Function} fn 
     */
    _setClick(configName, fn) {
        this.clickFn.set(configName, fn)
    }

    /**
     * - Focus the search component to be interacted with
     */
    _focusSearch() {
        this.selected = true
        this.searchBar.textInput.grabWindowFocus()
        this.searchBar.textInput.focus()
    }

    /**
     * - Adds the slider element to the current block
     * @returns
     */
    _addSlider() {
        if (this.sliderAdded) return

        this.mainRightBlock.addChild(this.elementsSlider)
        this.sliderAdded = true
    }

    /**
     * - Removes the slider element to the current block
     * @returns 
     */
    _removeSlider() {
        if (!this.sliderAdded) return

        this.mainRightBlock.removeChild(this.elementsSlider)
        this.sliderAdded = false
    }
}