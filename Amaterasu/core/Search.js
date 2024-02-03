import TextInputElement from "../../DocGuiLib/elements/TextInput"
import { ScrollComponent } from "../../Elementa"
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
        this.matches = null
        this.matchesAmount = 0
        this.clickFn = new Map()

        this.rightBlock = new ScrollComponent("no elements found", 5.0)
            .setX((1).pixel())
            .setY((1).pixel())
            .setWidth((100).percent())
            .setHeight((100).percent())
            .setChildOf(this.mainRightBlock)

        this.rightBlock.hide()

        this.searchBar = new TextInputElement("Search...", 73.3, 2, 15, 5)
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
            .setChildOf(this.mainBlock)
    }

    _onKeyType(string) {
        // Make the text empty if the user deletes 2 chars
        if (/^Search[\.]+$/.test(string)) return this.searchBar.textInput.setText("")

        // Return & reset if the focus has been lost
        if (!this.selected) return this._reset()

        // Return & reset if the string is empty and the user has searched before
        if (!string && this.matchesAmount) return this._reset()

        // Return if the string is empty so it doesn't try to search for ""
        if (!string) return

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

                if (obj.text.toLowerCase().includes(string) || obj.description.toLowerCase().includes(string)) {
                    this.matches[0].settings.push(obj)
                }
            })

        })

        // Add the current match length so we can use it on the reset values
        const mLength = this.matches[0].settings.length
        if (mLength) this.matchesAmount = mLength

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
        this.matchesAmount = 0

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
}