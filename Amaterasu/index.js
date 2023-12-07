import ConfigTypes from "./core/ConfigTypes"
import Settings from "./core/Settings"

const defaultConfig = {
    "Dungeons": [
        ["runSplits", "Run Splits", "Displays your current dungeon's run splits", ConfigTypes.TOGGLE, false],
        ["bossSplits", "Boss Splits", "Displays your current dungeon's boss splits", ConfigTypes.SLIDER, [0, 10], 1],
        ["someButton", "Feature button", "This is just an example of a button", ConfigTypes.BUTTON, 0]
    ],
    "Fishing": [
        ["bossBar", "Boss Bar", "Displays a boss bar on creatures that you can lootshare from", ConfigTypes.TOGGLE, false],
        ["titleTimer", "Title Timer","Displays the hypixel's timer as a client title", ConfigTypes.SLIDER, [0, 10], 1],
        ["someButton2", "Feature button 2", "This is just an example of a button", ConfigTypes.BUTTON, 0]
    ],
    "Garden": [
        ["gardenDisplay", "Garden Display", "Displays tab info from the garden", ConfigTypes.TOGGLE, false]
    ],
    "Mining": [
        ["gemstoneProfit", "Gemstone Mining Proift", "Displays the amount of money mining you've made this session", ConfigTypes.TOGGLE, false]
    ],
    "Kuudra": [
        ["ftDisplay", "Fatal Tempo Display", "Displays the current fatal tempo amount", ConfigTypes.TOGGLE, false],
        ["customItem", "Custom Item", "Some random example text here", ConfigTypes.SELECTION, ["item", "item2", "item3"], 2],
        ["customInput", "Custom Input", "Some random example text here", ConfigTypes.TEXTINPUT, "testing input"],
        ["customColorPicker", "Custom Color Picker", "Some random example text here", ConfigTypes.COLORPICKER, "FFFFFF"]
    ]
}

const setting = new Settings("Amaterasu", "data/settings.json", "data/ColorScheme.json", defaultConfig)
    .setCommand("amat")
    .onClick("Dungeons", "someButton", () => ChatLib.chat("Test"))
    .onClick("Fishing", "someButton2", () => ChatLib.chat("Test 2"))

// ChatLib.chat(setting.settings.runSplits) // false/true