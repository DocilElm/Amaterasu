export default class Configs {
    constructor(moduleName, configPath, defaultConfig, save = true) {
        this.moduleName = moduleName
        this.configPath = configPath
        this.defaultConfig = defaultConfig
        this.save = save

        this.config = JSON.parse(FileLib.read(this.moduleName, this.configPath)) ?? []
        this._makeDefaultSettings()

        // Registers
        register("gameUnload", () => this._saveToFile())
    }

    /**
     * - Makes a json setting with the given array and category and saves
     * it on the main config variable
     * @param {String} category 
     * @param {[String, String, String, Number, Number, Number]} array 
     * @returns this for method chaining
     */
    _makeSettings(category, array = [], overWrite = false) {
        const [ name, text, description, type, defaultValues, value, hideFeatureName ] = array

        const obj = this.config.find(names => names.category === category)

        if (!obj) {
            this.config.push({ category: category, settings: [
                {
                    name: name,
                    text: text,
                    description: description,
                    type: type,
                    defaultValue: defaultValues,
                    value: value ?? defaultValues,
                    hideFeatureName: hideFeatureName
                }
            ] })
            
            return this
        }

        // Avoid overwritting data if it exists
        if (!overWrite && obj.settings.some(settingsObj => settingsObj.name === name)) return

        obj.settings.push({
            name: name,
            text: text,
            description: description,
            type: type,
            defaultValue: defaultValues,
            value: value ?? defaultValues,
            hideFeatureName: hideFeatureName
        })

        return this
    }

    /**
     * - Makes settings using the given default config
     * @returns {JSON}
     */
    _makeDefaultSettings() {
        if (!this.defaultConfig) return
        
        Object.keys(this.defaultConfig).forEach(categoryName => {
            this.defaultConfig[categoryName].forEach(arrays => {
                this._makeSettings(categoryName, arrays)
            })
        })

        this._saveToFile()

        return this.config
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

        FileLib.write(
            this.moduleName,
            this.configPath,
            JSON.stringify(this.config, null, 4),
            true
        )
    }
}