import ConfigTypes from "./core/ConfigTypes"
import Settings from "./core/Settings"

// This is one way of loading default config objects from inside the code
// although it seems fine the bigger the module gets it's better to make a json file instead
const defaultConfig1 = {
    "Dungeons": [
        ["runSplits", "Run Splits", "Displays your current dungeon's run splits", ConfigTypes.TOGGLE, false],
        ["bossSplits", "Boss Splits", "Displays your current dungeon's boss splits", ConfigTypes.SLIDER, [0, 10], 1],
        ["someButton", "Feature button", "This is just an example of a button", ConfigTypes.BUTTON, 0]
    ],
    "Fishing": [
        ["bossBar", "Boss Bar", "Displays a boss bar on creatures that you can lootshare from", ConfigTypes.TOGGLE, false],
        ["titleTimer", "Title Timer","Displays the hypixel's timer as a client title", ConfigTypes.SLIDER, [0, 10], 1],
        ["someButton2", "Feature button 2", "This is just an example of a button", ConfigTypes.BUTTON, 0]
    ]
}

// And hence why you can also just do this
// since both function the exact same way (because they really are the same thing)
// you can just read a json and parse it and then use that as default config
const defaultConfig = JSON.parse(FileLib.read("Amaterasu", "data/defaultSettings.json"))

/*
This is what the object to making a config is built by
NormalObject = {
    the [key1] is the category name
    "key1": [] // this would be our settings elements
    the inner array is formed by the following params
    [
        ConfigName, // Most important one since that's going to be used to get the value of the config from
        Text, // The text to display
        Description, // The description to display
        ConfigType, // Another important one since depending on this value it'll create an element of that exact same type
        DefaultValues, // The starting values for this element
        Value, // The actual value for this element (if you leave it empty it'll use the DefaultValues)
        HideFeatureName // Currently does nothing but it's meant to be used as a param for the name of the config that should be enabled for this element to unhide/hide itself
    ]
}
*/

// Make a new [Settings] class and save it so you can further more use this variable outside of this file
// The params would be (ModuleName, SettingsPath, ColorSchemePath, DefaultConfig, optional: TitleText, optional: SortCategories)
const setting = new Settings("Amaterasu", "data/settings.json", "data/ColorScheme.json", defaultConfig, "&&aAmaterasu Settings")
    .setCommand("amat") // Set the command for this gui to open with
    // Adds a new element meaning it adds a whole new config with the given params and reloads the window itself
    // to have the changes
    // The params (CategoryName, ConfigName, Text, Description, ConfigType, DefaultValues, Value, HideFeatureName)
    .addElement("Dungeons", "testFeature", "Testing feature", "Some example text here", ConfigTypes.BUTTON, 0)
    // Removes an element that matches the given params and reloads the window itself
    // to have the changes
    // The params (CategoryName, ConfigName)
    .removeElement("Dungeons", "testFeature")
    // This is an example of a click function in a button element
    // The params (CategoryName, ConfigName, Function to run)
    .onClick("Dungeons", "changeRunSplitsDisplay", () => ChatLib.chat("Click !"))

// This is how to get settings values
setting.settings.testFeature

// You could also do (if it wasn't obvious enough)
// in case you have a feature variable check
const configName = "testFeature"
setting.settings[configName]