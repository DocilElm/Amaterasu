import ElementUtils from "../../DocGuiLib/core/Element"
import DividerElement from "../../DocGuiLib/elements/Divider"
import TextInputElement from "../../DocGuiLib/elements/TextInput"
import { CenterConstraint, CramSiblingConstraint, ScrollComponent, UIRoundedRectangle } from "../../Elementa"
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
        this.categoryName = "Search Results"

        this.selected = false
        this.sliderAdded = false
        this.matches = null
        this.hasSearched = false

        this.rightBlock = new ScrollComponent("no elements found", 5.0)
            .setX((1).pixel())
            .setY((1).pixel())
            .setWidth((98).percent())
            .setHeight((98).percent())
            .setChildOf(this.mainRightBlock)

        this.elementsSlider = new UIRoundedRectangle(3)
            .setX((3).pixels(true))
            .setWidth((this.parentClass.AmaterasuGui.scrollbarSize).pixels())
            .setColor(ElementUtils.getJavaColor(this.handler.getColorScheme().Amaterasu.scrollbar.color))

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
        this.rightBlock.clearChildren()
        this.createElementClass.subcategories.clear()
        this.createElementClass?._hideDropDownComps()
        this.createElementClass.elements = []

        this.matches = [
            {
                "category": this.categoryName,
                "settings": []
            }
        ]

        this.oldConfig.forEach(mainObj => {

            mainObj.settings.forEach(obj => {
                if (this.matches[0].settings.some(someObj => someObj.name.toLowerCase() === obj.name.toLowerCase())) return

                const text = obj.text.toLowerCase()
                const description = obj.description.toLowerCase()
                const tags = obj.tags

                if (!(
                    text.includes(string.toLowerCase()) ||
                    description.includes(string.toLowerCase()) ||
                    (tags?.length && tags.some(it => it.toLowerCase().includes(string.toLowerCase())))
                )) return

                this.matches[0].settings.push(obj)
            })

        })

        // Add the current match length so we can use it on the reset values
        this.hasSearched = true

        this.parentClass._hideAll()
        this.rightBlock.unhide(true)
        this.config = this.matches

        this.createElementClass._create()
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
        this.createElementClass._hideElement(this.parentClass.settings)

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
     * - Focus the search component to be interacted with
     */
    _focusSearch() {
        this.selected = true
        this.searchBar.textInput.grabWindowFocus()
        this.searchBar.textInput.focus()
    }

    /**
     * - Adds the slider element to the current block
     * - (ps: the `slider` here refers to the `scrollbar`)
     * @returns
     */
    _addSlider() {
        if (this.sliderAdded) return

        this.mainRightBlock.addChild(this.elementsSlider)
        this.sliderAdded = true
    }

    /**
     * - Removes the slider element to the current block
     * - (ps: the `slider` here refers to the `scrollbar`)
     * @returns 
     */
    _removeSlider() {
        if (!this.sliderAdded) return

        this.mainRightBlock.removeChild(this.elementsSlider)
        this.sliderAdded = false
    }

    /**
     * - Creates a divider with a string in the middle
     * @param {String} string 
     * @returns this for method chaining
     */
    _createDivider(string) {
        if (!string) return
        new DividerElement(string, 0, 0, 85, 5)
            ._setPosition(
                new CenterConstraint(),
                new CramSiblingConstraint(5)
            )
            ._create(this.handler.getColorScheme())
            .setChildOf(this.rightBlock)

        return this
    }
}