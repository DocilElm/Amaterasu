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

        this._checkSettings()
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
     * - Checks whether the current file setting contains the
     * correct values, types etc... for all the different settings
     * @returns
     */
    _checkSettings() {
        if (!this.config) return

        const defaultConfigNames = new Map()
        const defaultCategories = new Set()

        Object.keys(this.defaultConfig).forEach(categoryName => {
            // Add the category to the [Set] so it can check if it exists
            defaultCategories.add(categoryName)

            // Loop through all the config elements
            this.defaultConfig[categoryName].forEach(arr => {
                const [ name, text, description, type, defaultValues, value, hideFeatureName ] = arr

                // Making a config object so we can use it as check
                const confObj = {
                    name: name,
                    text: text,
                    description: description,
                    type: type,
                    defaultValue: defaultValues,
                    value: value ?? defaultValues,
                    hideFeatureName: hideFeatureName
                }

                // Add it to the [Map] so we can use it outside of this loop
                defaultConfigNames.set(name, confObj)
            })
        })

        // Loop through all the main config objects
        this.config.forEach((obj, mainIdx) => {
            // Checks whether the category exists in default values or not
            // if it dosen't, delete it from the config file.
            if (!defaultCategories.has(obj.category)) return this.config.splice(mainIdx, 1)

            // Loop through all the config objects
            obj.settings.forEach((objConf, idx) => {
                const name = objConf.name

                // Check whether the key [name] exists in the default values
                if (defaultConfigNames.has(name)) {
                    const confObj = defaultConfigNames.get(name)

                    // Check if any of these object values changed
                    // from from the main default values
                    if (
                        objConf.type === confObj.type &&
                        objConf.text === confObj.text &&
                        objConf.description === confObj.description &&
                        objConf.hideFeatureName === confObj.hideFeatureName
                        ) return

                    // If they did update this object to have the correct values
                    objConf.type = confObj.type
                    objConf.text = confObj.text
                    objConf.desc = confObj.desc
                    objConf.defaultValue = confObj.defaultValue
                    objConf.value = objConf.value ?? confObj.value
                    objConf.hideFeatureName = confObj.hideFeatureName

                    return
                }

                // If the key [name] dosen't exist anymore in the default values
                // we delete it from the file settings
                obj.settings.splice(idx, 1)
            })
        })
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