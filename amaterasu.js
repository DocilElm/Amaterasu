import Settings from "./core/Settings"

const version = JSON.parse(FileLib.read("Amaterasu", "metadata.json")).version
const changelog = `# §6Amaterasu-v${ version }\n` + FileLib.read("Amaterasu", "changelog.md")
const readme = FileLib.read("Amaterasu", "README.md")
const defaultConfig = JSON.parse(FileLib.read("Amaterasu", "data/defaultSettings.json"))

const schemes = ["data/ColorScheme.json", "data/scheme-Pink.json", "data/scheme-vigil.json"]

const config = new Settings("Amaterasu", "data/settings.json", "data/ColorScheme.json", defaultConfig)
    .setCommand("amaterasu", ["amat"])
    .onClick("General", "MyDiscord", () => {
        ChatLib.command("ct copy https://discord.gg/SK9UDzquEN", true)
        ChatLib.chat("&6Copied Discord Link!")
    })
    .onClick("GUI", "apply", apply)
    .onClick("General", "redirect", () => config.redirect("GUI", "height"))

    .addMarkdown("Changelog", changelog)
    .addMarkdown("README", readme)

function apply() {
    const conf = config.settings
    const currScheme = schemes[conf.scheme]

    let scheme = JSON.parse(FileLib.read("Amaterasu", currScheme));
    scheme.Amaterasu.backgroundBox[3] = conf.alpha

    FileLib.write("Amaterasu", currScheme, JSON.stringify(scheme, null, 4))

    config
        .setPos(conf.x, conf.y)
        .setSize(conf.width, conf.height)
        .changeScheme(schemes[conf.scheme])
        .apply()
    
}
apply()

export default () => config.settings