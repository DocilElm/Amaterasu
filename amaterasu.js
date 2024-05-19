// wth a lib with an entry???

import Settings from "./core/Settings"

const version = JSON.parse(FileLib.read("Amaterasu", "metadata.json")).version
const changelog = `# §6Amaterasu-v${ version }\n` + FileLib.read("Amaterasu", "changelog.md")
const readme = FileLib.read("Amaterasu", "README.md")
const defaultConfig = JSON.parse(FileLib.read("Amaterasu", "data/defaultSettings.json"))

const schemes = ["data/ColorScheme.json", "data/scheme-Pink.json"]

const config = new Settings("Amaterasu", "data/settings.json", "data/ColorScheme.json", defaultConfig)
    .setCommand("amaterasu", ["amat"])
    .onClick("General", "MyDiscord", () => {
        ChatLib.command("ct copy https://discord.gg/SK9UDzquEN", true)
        ChatLib.chat("&6Copied Discord Link!")
    })
    .onClick("GUI", "apply", () => {
        config
        .setPos(config.settings.x, config.settings.y)
        .setSize(config.settings.width, config.settings.height)
        .changeScheme(schemes[config.settings.scheme])
        .apply()
    })

    .addMarkdown("Changelog", changelog)
    .addMarkdown("README", readme)

config
    .changeScheme(schemes[config.settings.scheme])
    .apply()