// We import our settings
import settings from "./config"

// Now we can use its provided values

// For example only running a feature whenever "testingSwitch" is enabled
register("step", () => {
    // If it's disabled we return (won't keep going further down)
    if (!settings().testingSwitch) return

    // Otherwise (if it's enabled) we say something in chat
    ChatLib.chat("testingSwitch is enabled!")
}).setFps(1)

// Making a custom command

// A lot of people would prefer having custom command system
// here's how we do that in Amaterasu
register("command", (...args) => {
    // If no arguments were passed to the command
    // (meaning only "/mytest" was ran and not "/mytest something here")
    // we open our Amaterasu gui
    if (!args.length) return settings().getConfig().openGui()

    // If args[0] is defined we do something else
    if (args[0]) {
        // For example sending a message or whatever your custom command options may be
        ChatLib.chat("arg 1 is defined!")

        return
    }
}).setName("mytest")

// We can also use registerListener from here
// as well as all the other options that [Settings] class gives
settings().getConfig().registerListener("testingSwitch", (previousValue, newValue) => {
    ChatLib.chat(`looks like testingSwitch changed | ${previousValue} -> ${newValue} |`)
})