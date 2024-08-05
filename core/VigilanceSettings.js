import ConfigTypes from "./ConfigTypes"

const PropertyType = Java.type("gg.essential.vigilance.data.PropertyType")

const saveAmaterasuSettings = (moduleName, configPath, str) => {
    FileLib.write(
        moduleName,
        configPath,
        str,
        true
    )

    console.log(`[Amaterasu - ${moduleName}] successfully created config file at ${configPath}.`)

    FileLib.write(
        moduleName,
        "data/ColorScheme.json",
        FileLib.read("Amaterasu", "data/_DefaultScheme.json"),
        true
    )

    console.log(`[Amaterasu - ${moduleName}] successfully created color scheme file at "data/ColorScheme.json".`)
}

/**
 * - Helps migrating data from Vigilance to Amaterasu.
 * @param {Vigilance} instance The vigilance instance.
 * @param {String} moduleName The module name that vigilance is currently processing
 * @param {String} moduleToConvert The module name to migrate the settings from Vigilance to Amaterasu
 * @param {String} configPath The config path for the migrated data to be created at. default: `/data/config.js`
 * @param {String} overwrite Whether it should overwrite the file if it has been detected as existing
 * @returns 
 */
export const convertToAmaterasu = (instance, moduleName, moduleToConvert = null, configPath = null, overwrite = false) => {
    configPath = configPath ?? `/data/config.js`
    
    if (!overwrite && FileLib.exists(moduleName, configPath)) return
    if (moduleToConvert && moduleName !== moduleToConvert) return

    const currentInstance = instance.__proto__
    const obj = currentInstance.__config_props__
    const objFn = currentInstance.__config_functions__

    let str = `// Make sure these go to the right directory \nimport Settings from "../../Amaterasu/core/Settings"\nimport DefaultConfig from "../../Amaterasu/core/DefaultConfig"\nconst config = new DefaultConfig("${moduleName}", "data/settings.json")\n`

    Object.keys(obj).forEach(key => {
        const attributes = obj[key]
        const { 
            type,
            name,
            category,
            subcategory,
            description,
            min,
            max,
            minF,
            maxF,
            decimalPlaces,
            increment,
            options,
            allowAlpha,
            placeholder
        } = attributes

        switch (type) {
            case PropertyType.SWITCH:
                str += `\n.addSwitch({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    subcategory: "${subcategory}"\n})`
                break
            
            case PropertyType.CHECKBOX:
                str += `\n.addToggle({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    subcategory: "${subcategory}"\n})`
                break
        
            case PropertyType.TEXT:
                str += `\n.addTextInput({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    value: "${placeholder}",\n    placeHolder: "${placeholder}",\n    subcategory: "${subcategory}"\n})`
                break
            
            case PropertyType.PARAGRAPH:
                str += `\n.addTextInput({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    value: "${placeholder}",\n    placeHolder: "${placeholder}",\n    subcategory: "${subcategory}"\n})`
                break

            case PropertyType.SLIDER:
                str += `\n.addSlider({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    options: [${min}, ${max}],\n    value: ${min},\n    subcategory: "${subcategory}"\n})`
                break

            case PropertyType.PERCENT_SLIDER:
                str += `\n.addSlider({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    options: [0.001, 1],\n    value: ${minF},\n    subcategory: "${subcategory}"\n})`
                break

            case PropertyType.DECIMAL_SLIDER:
                str += `\n.addSlider({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    options: [${minF}, ${maxF}],\n    value: ${minF},\n    subcategory: "${subcategory}"\n})`
                break

            case PropertyType.SELECTOR:
                str += `\n.addDropDown({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    options: ${JSON.stringify(Object.values(options))},\n    value: 0,\n    subcategory: "${subcategory}"\n})`
                break

            case PropertyType.COLOR:
                str += `\n.addColorPicker({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    value: [255, 255, 255, 255],\n    subcategory: "${subcategory}"\n})`
                break
        }
    })

    Object.keys(objFn).forEach(key => {
        if (!key) return

        const attributes = objFn[key]
        const { type, name, category, subcategory, description } = attributes

        if (type !== PropertyType.BUTTON) return

        str += `\n.addButton({\n    category: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: ${JSON.stringify(description)},\n    subcategory: "${subcategory}",\n    onClick() {\n        ChatLib.chat("this is an example function")\n    }\n})`
    })

    str += `\n\nconst setting = new Settings("${moduleName}", config, "data/ColorScheme.json") // make sure to set your command with [.setCommand("commandname")]\n\nexport default () => setting.settings`

    saveAmaterasuSettings(moduleName, configPath, str)
}

/**
 * - Helps migrating data from previous Amaterasu config system to new Amaterasu config system.
 * @param {[{}]} obj The config object.
 * @param {String} moduleName The module name to migrate to.
 * @param {String} configPath The config path for the migrated data to be created at. default: `/data/config.js`
 * @param {String} overwrite Whether it should overwrite the file if it has been detected as existing
 * @returns 
 */
export const convertObjToAmateras = (obj, moduleName = null, configPath = null, overwrite = false) => {
    configPath = configPath ?? `/data/config.js`

    if (!overwrite && FileLib.exists(moduleName, configPath)) return

    let str = `// Make sure these go to the right directory \nimport Settings from "../../Amaterasu/core/Settings"\nimport DefaultConfig from "../../Amaterasu/core/DefaultConfig"\nconst config = new DefaultConfig("${moduleName}", "data/settings.json")\n`

    Object.keys(obj).forEach(category => {
        const settings = obj[category]

        settings.forEach(configArray => {
            const [ configName, text, description, type, defaultValue, value, hideFeatureName ] = configArray

            switch (type) {
                case ConfigTypes.SWITCH:
                    str += `\n.addSwitch({\n    category: "${category}",\n    configName: "${configName}",\n    title: "${text}",\n    description: ${JSON.stringify(description)},\n    subcategory: null\n})`
                    break
                
                case ConfigTypes.TOGGLE:
                    str += `\n.addToggle({\n    category: "${category}",\n    configName: "${configName}",\n    title: "${text}",\n    description: ${JSON.stringify(description)},\n    subcategory: null\n})`
                    break
            
                case ConfigTypes.TEXTINPUT:
                    str += `\n.addTextInput({\n    category: "${category}",\n    configName: "${configName}",\n    title: "${text}",\n    description: ${JSON.stringify(description)},\n    value: "${defaultValue}",\n    placeHolder: "${defaultValue}",\n    subcategory: null\n})`
                    break
                
                case ConfigTypes.SLIDER:
                    str += `\n.addSlider({\n    category: "${category}",\n    configName: "${configName}",\n    title: "${text}",\n    description: ${JSON.stringify(description)},\n    options: [${defaultValue[0]}, ${defaultValue[1]}],\n    value: ${defaultValue[0]},\n    subcategory: null\n})`
                    break
    
                case ConfigTypes.SELECTION:
                    str += `\n.addDropDown({\n    category: "${category}",\n    configName: "${configName}",\n    title: "${text}",\n    description: ${JSON.stringify(description)},\n    options: ${JSON.stringify(Object.values(defaultValue))},\n    value: 0,\n    subcategory: null\n})`
                    break
    
                case ConfigTypes.COLORPICKER:
                    str += `\n.addColorPicker({\n    category: "${category}",\n    configName: "${configName}",\n    title: "${text}",\n    description: ${JSON.stringify(description)},\n    value: [255, 255, 255, 255],\n    subcategory: null\n})`
                    break
                
                case ConfigTypes.BUTTON:
                    str += `\n.addButton({\n    category: "${category}",\n    configName: "${configName}",\n    title: "${text}",\n    description: ${JSON.stringify(description)},\n    subcategory: null,\n    onClick() {\n        ChatLib.chat("this is an example function")\n    }\n})`
                    break
            }
        })

    })

    str += `\n\nconst setting = new Settings("${moduleName}", config, "data/ColorScheme.json") // make sure to set your command with [.setCommand("commandname")]\n\nexport default () => setting.settings`

    saveAmaterasuSettings(moduleName, configPath, str)
}