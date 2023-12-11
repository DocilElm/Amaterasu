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
            ._create(this.handler.colorScheme)
            .setChildOf(this.mainBlock)

        this.createElementClass = new CreateElement(this)
    }

    _onKeyType(string) {
        if (!string || string === "Search..." || !this.selected) {
            this.rightBlock.hide()
            this.parentClass._unhideAll()
            //this.selected = false
            return
        }

        this.rightBlock.clearChildren()
        this.matches = [
            {
                "category": "SearchBar",
                "settings": []
            }
        ]

        this.oldConfig.forEach(mainObj => {

            mainObj.settings.forEach(obj => {
                if (this.matches[0].settings.some(someObj => someObj.name === obj.name)) return ChatLib.chat("a")

                if (obj.text.includes(string) || obj.description.includes(string)) {
                    this.matches[0].settings.push(obj)
                }
            })

        })

        this.parentClass._hideAll()
        this.rightBlock.unhide(true)
        this.config = this.matches

        this.createElementClass._create()
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