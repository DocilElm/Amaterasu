const destination = `${Config.modulesFolder}/Amaterasu/data/Custom.zip`
const mainDest = `${Config.modulesFolder}/Amaterasu/data/_custom`
const File = Java.type("java.io.File")
const PrintStream = Java.type("java.io.PrintStream")
const Byte = Java.type("java.lang.Byte")
const data = JSON.parse(FileLib.read("Amaterasu", "data/CustomSchemes.json")) ?? { savedAt: null, schemes: [], currentCustom: null }

const getConnection = (url) => com.chattriggers.ctjs.CTJS.INSTANCE.makeWebRequest(url)

const setupDir = () => {
    const dir = new File(mainDest)
    if (!dir.exists()) return

    dir.listFiles().forEach(f => {
        if (!f.isDirectory()) return

        const name = f.getName().toLowerCase()

        if (!data.schemes.find(it => it === name)) data.schemes.push(name)
        f.renameTo(new File(`${mainDest}/${name}`))
    })
}

const renameFolder = (directory) => {
    const dir = new File(directory)

    dir.listFiles().forEach(it => {
        if (!it.isDirectory() || !it.getName().includes("DocilElm-AmaterasuSchemes")) return

        it.renameTo(new File(`${directory}/_custom`))
        setupDir()
    })
}

const getZipFile = (url) => {
    new Thread(() => {
        const dir = new File(destination)
        dir.getParentFile().mkdirs()

        const connection = getConnection(url)
        if (connection.getResponseCode() !== 200) return connection.disconnect()

        const inputStream = connection.getInputStream()
        const filePrintStream = new PrintStream(dir)

        let buffer = new Packages.java.lang.reflect.Array.newInstance(Byte.TYPE, 65536)
        let len = null

        while ((len = inputStream.read(buffer)) > 0) {
            filePrintStream.write(buffer, 0, len)
        }

        inputStream.close()
        filePrintStream.close()
        connection.disconnect()

        FileLib.unzip(destination, `${Config.modulesFolder}/Amaterasu/data`)
        dir.delete()
        data.savedAt = Date.now()

        renameFolder(`${Config.modulesFolder}/Amaterasu/data`)
    }).start()
}

if (!data.savedAt || data.savedAt && Date.now() - data.savedAt >= 86400000) {
    getZipFile("https://api.github.com/repos/DocilElm/AmaterasuSchemes/zipball/")
}

new Thread(() => {
    setupDir()
}).start()

/**
 * - Applies a custom scheme that's inside the Github Repo
 * @param {import("./Settings").default} settings The [Settings] instance to apply the scheme to
 * @param {string} name The scheme name passed through by the user on a textinput
 * @param {boolean} sendError Whether this function should send an error if the scheme was not found (`true` by default)
 * @link https://github.com/DocilElm/AmaterasuSchemes
 */
export const setCustomScheme = (settings, name, sendError = true) => {
    name = name?.toLowerCase()
    if (!name || data.currentCustom === name) return
    if (!settings) throw `${settings} is not a valid [Settings] instance`
    if (!data.schemes.some(it => it === name)) {
        if (sendError) ChatLib.chat(`&7[&c${settings.moduleName}&7]&f: &cCould not find custom scheme with name &b${name}&r`)
        return
    }

    const handler = settings.getHandler()
    const newScheme = JSON.parse(FileLib.read("Amaterasu", `data/_custom/${name}/ColorScheme.json`))
    if (!newScheme) return console.log(`[Amaterasu - ${settings.moduleName}] Error while attempting to request color scheme: ${name}`)

    handler._setColorScheme(newScheme)
    settings.apply()
    data.currentCustom = name

    // Save the new ColorScheme
    new Thread(() => {
        settings._saveScheme(settings.colorSchemePath, newScheme)
    }).start()
}

register("gameUnload", () => {
    FileLib.write("Amaterasu", "data/CustomSchemes.json", JSON.stringify(data, null, 4), true)
})