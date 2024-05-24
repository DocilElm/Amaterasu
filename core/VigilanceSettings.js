const PropertyType = Java.type("gg.essential.vigilance.data.PropertyType")
const localDir = "./config/ChatTriggers/modules/"

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

    if (FileLib.exists(`${localDir}/${moduleName}/${configPath}`) && !overwrite) return
    if (moduleToConvert && moduleName !== moduleToConvert) return

    const currentInstance = instance.__proto__
    const obj = currentInstance.__config_props__
    const objFn = currentInstance.__config_functions__

    let str = `import Settings from "../../Amaterasu/core/Settings"\nimport DefaultConfig from "../../Amaterasu/core/DefaultConfig"\nconst config = new DefaultConfig("${moduleName}", "data/settings.json")\n\nconfig`

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
                str += `\n.addSwitch({\n    categoryName: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: "${description}",\n    subcategory: "${subcategory}"\n})`
                break
            
            case PropertyType.CHECKBOX:
                str += `\n.addToggle({\n    categoryName: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: "${description}",\n    subcategory: "${subcategory}"\n})`
                break
        
            case PropertyType.TEXT:
                str += `\n.addTextInput({\n    categoryName: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: "${description}",\n    value: "${placeholder}",\n    placeHolder: "${placeholder}",\n    subcategory: "${subcategory}"\n})`
                break
            
            case PropertyType.PARAGRAPH:
                str += `\n.addTextInput({\n    categoryName: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: "${description}",\n    value: "${placeholder}",\n    placeHolder: "${placeholder}",\n    subcategory: "${subcategory}"\n})`
                break

            case PropertyType.SLIDER:
                str += `\n.addSlider({\n    categoryName: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: "${description}",\n    options: [${min}, ${max}],\n    value: ${min},\n    subcategory: "${subcategory}"\n})`
                break

            case PropertyType.DECIMAL_SLIDER:
                str += `\n.addSlider({\n    categoryName: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: "${description}",\n    options: [${minF}, ${maxF}],\n    value: ${minF},\n    subcategory: "${subcategory}"\n})`
                break

            case PropertyType.SELECTOR:
                str += `\n.addSelection({\n    categoryName: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: "${description}",\n    options: ${JSON.stringify(Object.values(options))},\n    value: 0,\n    subcategory: "${subcategory}"\n})`
                break

            case PropertyType.COLOR:
                str += `\n.addColorPicker({\n    categoryName: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: "${description}",\n    value: [255, 255, 255, 255],\n    subcategory: "${subcategory}"\n})`
                break
        }
    })

    Object.keys(objFn).forEach(key => {
        if (!key) return

        const attributes = objFn[key]
        const { type, name, category, subcategory, description } = attributes

        if (type !== PropertyType.BUTTON) return

        str += `\n.addButton({\n    categoryName: "${category}",\n    configName: "${key}",\n    title: "${name}",\n    description: "${description}",\n    subcategory: "${subcategory}",\n    onClick() {\n        ChatLib.chat("this is an example function")\n    }\n})`
    })

    str += `\n\nconst setting = new Settings("${moduleName}", config, "data/ColorScheme.json") // make sure to set your command with [.setCommand("commandname")]`

    FileLib.write(
        moduleName,
        configPath,
        str,
        true
    )

    console.log(`[Amaterasu - ${moduleName}] successfully created config file at ${configPath}.`)
}