import ConfigTypes from "./ConfigTypes"

const PropertyType = Java.type("gg.essential.vigilance.data.PropertyType")
const localDir = "./config/ChatTriggers/modules/"

/**
 * - Converts a vigilance setting into a [JSON] format for this settings gui
 * @param {Object} obj 
 * @param {String} moduleName 
 * @param {Boolean} overWrite Whether it should overwrite the old file if it exists or not (false by default)
 * @returns 
 */
export const convertToJSON = (instance, moduleName, overWrite = false, moduleToConvert = null) => {
    if (FileLib.exists(`${localDir}${moduleName}/data/defaultSettings.json`) && !overWrite) return
    if (moduleToConvert && moduleName !== moduleToConvert) return

    const currentInstance = instance.__proto__
    const obj = currentInstance.__config_props__
    const objFn = currentInstance.__config_functions__
    
    let resultObj = {}

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

        if (!resultObj[category]) resultObj[category] = []

        switch (type) {
            case PropertyType.SWITCH:
                resultObj[category].push([key, name, description, ConfigTypes.TOGGLE, false])
                break
            
            case PropertyType.CHECKBOX:
                resultObj[category].push([key, name, description, ConfigTypes.TOGGLE, false])
                break
        
            case PropertyType.TEXT:
                resultObj[category].push([key, name, description, ConfigTypes.TEXTINPUT, placeholder, null, placeholder])
                break
            
            case PropertyType.PARAGRAPH:
                resultObj[category].push([key, name, description, ConfigTypes.TEXTINPUT, placeholder, null, placeholder])
                break

            case PropertyType.SLIDER:
                resultObj[category].push([key, name, description, ConfigTypes.SLIDER, [min, max], min])
                break

            case PropertyType.DECIMAL_SLIDER:
                resultObj[category].push([key, name, description, ConfigTypes.SLIDER, [minF, maxF], minF])
                break

            case PropertyType.SELECTOR:
                resultObj[category].push([key, name, description, ConfigTypes.SELECTION, Object.values(options), 0])
                break

            case PropertyType.COLOR:
                resultObj[category].push([key, name, description, ConfigTypes.COLORPICKER, [255, 255, 255]])
                break

            default:
                break
        }
    })

    Object.keys(objFn).forEach(key => {
        if (!key) return

        const attributes = objFn[key]
        const { type, name, category, subcategory, description } = attributes

        if (type !== PropertyType.BUTTON) return

        if (!resultObj[category]) resultObj[category] = []

        resultObj[category].push([key, name, description, ConfigTypes.BUTTON, 0])
    })

    FileLib.write(
        moduleName,
        "/data/defaultSettings.json",
        JSON.stringify(resultObj, null, 4),
        true
    )
}