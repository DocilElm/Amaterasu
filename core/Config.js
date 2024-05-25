import ConfigTypes from "./ConfigTypes"

export default class Config {
    /**
     * - This class handles most parts of the config system for Amaterasu
     * @param {DefaultConfig} defaultConfig The default class instance
     * @param {Boolean} save Whether it should save the config to memory
     */
    constructor(defaultConfig, save = true) {
        this.defaultConfig = defaultConfig
        this.save = save

        this.config = []
        this._makeConfig()
        this._saveToFile()

        // Registers
        register("gameUnload", this._saveToFile.bind(this))
    }

    _makeConfig() {
        this.defaultConfig.categories.forEach(categoryName => {
            const settings = this.defaultConfig[categoryName]

            settings.forEach(dobj => {
                const obj = this.config.find(names => names.category === categoryName)
                if (!obj) return this.config.push({ category: categoryName, settings: [dobj] })

                obj.settings.push(dobj)
            })
        })
    }

    /**
     * - Makes the current config into an actual dev friendly format
     * e.g instead of [Settings: { name: "configName", text: "config stuff" ...etc }]
     * converts it into { configName: false }
     * @returns {JSON}
     */
    _normalizeSettings() {
        let settings = {}

        this.config.forEach(obj => {
            obj.settings.forEach(settingsObj => {
                if (settingsObj.type === ConfigTypes.MULTICHECKBOX) {
                    settingsObj.options.forEach(opts => {
                        settings[opts.configName] = opts.value
                    })
                    return
                }

                settings[settingsObj.name] = settingsObj.value
            })
        })

        return settings
    }

    /**
     * - Saves the current config json into the module's given config file path
     */
    _saveToFile() {
        if (!this.save) return

        const data = this.config.map(it => {
            return { category: it.category, settings: it.settings.map(it2 => {
                // Perfection.
                if (it2.type === ConfigTypes.MULTICHECKBOX) return { type: it2.type, name: it2.name, options: it2.options.map(opts => { return { name: opts.configName, value: opts.value } }) }

                return { type: it2.type, name: it2.name, value: it2.value }
            }) }
        })

        FileLib.write(
            this.defaultConfig.moduleName,
            this.defaultConfig.filePath,
            JSON.stringify(data, null, 4),
            true
        )
    }
}