import Settings from "../Amaterasu/core/Settings"
import DefaultConfig from "../Amaterasu/core/DefaultConfig"

const version = JSON.parse(FileLib.read("Amaterasu", "metadata.json")).version

// markdowns
const CHANGELOG = `# §6Amaterasu-v${ version }\n` + FileLib.read("Amaterasu", "changelog.md")
const README = FileLib.read("Amaterasu", "README.md")
const LICENSE = FileLib.read("Amaterasu", "LICENSE")
const CREDITS = FileLib.read("Amaterasu", "CREDIT.md")
const schemes = ["data/ColorScheme.json", "data/scheme-vigil.json", "data/scheme-nwjn.json"]

const meinConf = new DefaultConfig("Amaterasu", "data/settings.json")
meinConf
    .addButton({
        categoryName: "General",
        configName: "MyDiscord",
        title: "Discord Server",
        description: "Join if you want to report a bug or want to make a suggestion",
        tags: [ "maybe" ],
        onClick() {
            ChatLib.command("ct copy https://discord.gg/SK9UDzquEN", true)
            ChatLib.chat("&6Copied Discord Link!")
        }
    })
    .addSelection({
        categoryName: "GUI",
        configName: "scheme",
        title: "Change My Scheme!",
        description: "Select which scheme you want from these presets (needs apply after)",
        options: ["Default", "Vigil", "nwjn"]
    })
    .addButton({
        categoryName: "GUI",
        configName: "apply",
        title: "Apply Changes",
        description: "Need to click this for window to reload with selected changes",
        onClick() {
            apply()
        }
    })
    .addSlider({
        categoryName: "GUI",
        configName: "alpha",
        title: "Change Background Alpha",
        description: "Changes the alpha of the background",
        options: [0, 255],
        value: 80
    })
    .addSlider({
        categoryName: "GUI",
        configName: "x",
        title: "Change X",
        description: "Changes the starting X coordinate of the GUI (in percent)",
        options: [0, 75],
        value: 20
    })
    .addSlider({
        categoryName: "GUI",
        configName: "y",
        title: "Change Y",
        description: "Changes the starting Y coordinate of the GUI (in percent)",
        options: [0, 75],
        value: 20
    })
    .addSlider({
        categoryName: "GUI",
        configName: "width",
        title: "Change Width",
        description: "Changes the width of the GUI (in percent)",
        options: [25, 100],
        value: 60
    })
    .addSlider({
        categoryName: "GUI",
        configName: "height",
        title: "Change Height",
        description: "Changes the height of the GUI (in percent)",
        options: [25, 100],
        value: 60
    })

const config = new Settings("Amaterasu", meinConf, "data/ColorScheme.json")
    .setCommand("amaterasu", ["amat"])

    .addMarkdown("Changelog", CHANGELOG)
    .addMarkdown("LICENSE", LICENSE)
    .addMarkdown("README", README)
    .addMarkdown("Credits", CREDITS)
    

function apply() {
    const conf = config.settings
    const currScheme = schemes[conf.scheme]

    let scheme = JSON.parse(FileLib.read("Amaterasu", currScheme));
    scheme.Amaterasu.backgroundBox[3] = conf.alpha

    FileLib.write("Amaterasu", currScheme, JSON.stringify(scheme, null, 4))
    config
        .setPos(conf.x, conf.y)
        .setSize(conf.width, conf.height)
        .changeScheme(currScheme)
        .apply()
    
}
apply()

export default () => config.settings;