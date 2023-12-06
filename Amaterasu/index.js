import ConfigTypes from "./core/ConfigTypes"
import Settings from "./core/Settings"

// const config = JSON.parse(FileLib.read("data/settings.json")) ?? []

// const checkForCategory = (category) => {
//     if (config.some(obj => obj.category === category)) return
    
//     return config.push({ category: category, settings: [] })
// }

// const makeSetting = (category, array = []) => {
//     const [ name, text, description, type, value ] = array

//     checkForCategory(category)

//     const obj = config.find(names => names.category === category)

//     obj.settings.push({
//         name: name,
//         text: text,
//         description: description,
//         type: type,
//         value: value
//     })

//     FileLib.write(
//         "Amaterasu",
//         "data/settings.json",
//         JSON.stringify(config, null, 4),
//         true
//     )

//     return
// }

// const a = [
//     ["runSplits", "Run Splits", "Displays your current dungeon's run splits", ConfigTypes.TOGGLE, false],
//     ["bossSplits", "Boss Splits", "Displays your current dungeon's boss splits", ConfigTypes.SLIDER, [0, 10, 1]],
//     ["someButton", "Feature button", "This is just an example of a button", ConfigTypes.BUTTON, 0],
// ]

// const b = [
//     ["bossBar", "Boss Bar", "Displays a boss bar on creatures that you can lootshare from", ConfigTypes.TOGGLE, false],
//     ["titleTimer", "Title Timer","Displays the hypixel's timer as a client title", ConfigTypes.SLIDER, [0, 10, 1]],
//     ["someButton2", "Feature button 2", "This is just an example of a button", ConfigTypes.BUTTON, 0],
// ]

// a.forEach((array) => {
//     makeSetting("Dungeons", array)
// })
// b.forEach((array) => {
//     makeSetting("Fishing", array)
// })

const setting = new Settings("data/settings.json", "data/ColorScheme.json", "Amaterasu", "amat")

setting
    .onClick("Dungeons", "someButton", () => ChatLib.chat("Test"))
    .onClick("Fishing", "someButton2", () => ChatLib.chat("Test 2"))

ChatLib.chat(setting.settings.runSplits)