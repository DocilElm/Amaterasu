# Amaterasu

Amaterasu is a ChatTriggers library designed to make creating and using a settings GUI simple and efficient.

### Some Gloating:

- cool gui
- fully customizable color scheme
- search bar + working search tags
- custom sorting
- no memory leak (sad vigilance noises)
- markdown support
- support for many different property types (e.g. Keybind, button to redirect to different config, multiline text inputs, etc)
- flexible "config dependencies"
- no red squiggly lines

## Installation:

add `"Amaterasu"` into your `requires` array in `metadata.json`

For more info on porting `Vigilance` settings into `Amaterasu` settings, see [How to migrate vigilance settings](https://github.com/DocilElm/Amaterasu/wiki/How-to-migrate-vigilance-settings)

## Documentation

If you are coming from `Vigilance` and would prefer a table of equilavent properties, they can be found [here](#vigilance-translations).

HAH YOU THOUGHT IM NOT GETTING PAID FOR THIS

intellisense will carry, jsdocs should be fine (read through code if you need to do anything not covered in [Usage](#usage))

## Usage

See [Installation](#installation).

### Basic Usage

im not getting paid fuck this

use intellisense or be blind your choice

`DefaultConfig` and `Settings` are the main 2 things.

`DefaultConfig` is for the "structure" of your config (i.e. defining your properties and such)

`Settings` is for all the gui things: color scheme, sorting, etc.

how to use:

1. create file for your config stuff
2. import things
3. create your `DefaultConfig`
4. populate your `DefaultConfig` using `.add_____` (e.g. `.addButton`)
5. using your `DefaultConfig`, create a `Settings`
6. do things you need to do with your `Settings`
7. `export default () => mySettings.settings`
8. (in another file) import your settings e.g. `import settings from './myConfig'`
9. profit `settings().myProperty`

### Advanced Usage

look through code or intellisense idfk gl

dm tree man or chicken man for help ig

### Color Schemes

apply using `.setScheme(/**/).apply()` or `Settings` constructor

schema can be found [here](ColorScheme.schema.json)

## Vigilance Translations

### Text Input

Vigilance

```js
@TextProperty({
    name: 'text',
    description: 'Example of text input that does not wrap the text',
    category: 'General',
    subcategory: 'Category',
    placeholder: 'Empty... :('
})
textInput = ''
```

Amaterasu

```js
.addTextInput({
    configName: 'textInput',
    title: 'text',
    description: 'Example of text input that does not wrap the text',
    category: 'General',
    subcategory: 'Category',
    value: '',
    placeHolder: 'Empty... :('
})
```

---

### Paragraph Input

Vigilance

```js
@ParagraphProperty({
    name: 'paragraph',
    description: 'Example of text input that does wrap the text',
    category: 'General',
    subcategory: 'Category',
    placeholder: 'Empty... :('
})
paraInput = ''
```

Amaterasu

```js
.addTextParagraph({
    configName: 'paraInput',
    title: 'paragraph',
    description: 'Example of text input that does wrap the text',
    category: 'General',
    subcategory: 'Category',
    value: '',
    placeHolder: 'Empty... :('
})
```

---

### Color Picker

Vigilance

```js
@ColorProperty({
    name: 'Color Picker',
    description: 'Pick a color! (hopefully...)',
    category: 'General',
    subcategory: 'Category'
})
myColor = Color.BLUE
```

Amaterasu

```js
.addColorPicker({
    configName: 'myColor',
    title: 'Color Picker',
    description: 'Pick a color! (hopefully...)',
    category: 'General',
    subcategory: 'Category',
    value: [0, 0, 255, 255]
})
```

---

### Switch

Vigilance

```js
@SwitchProperty({
    name: 'Do action!!!',
    description: 'toggle the checkbox in Not general! tab!',
    category: 'General',
    subcategory: 'Category',
    placeholder: 'Activate'
})
switch = false
```

Amaterasu

```js
.addSwitch({
    configName: 'switch',
    title: 'Do action!!!',
    description: 'toggle the checkbox in Not general! tab!',
    category: 'General',
    subcategory: 'Category'
})
```

---

### Checkbox

Vigilance

```js
@CheckboxProperty({
    name: 'Checkbox',
    description: 'Check this box',
    category: 'Not general!'
})
myCheckbox = false
```

Amaterasu

```js
.addToggle({
    configName: 'myCheckbox',
    title: 'Checkbox',
    description: 'Check this box',
    category: 'Not general!',
    subcategory: ''
})
```

---

### Selector (Dropdown)

Vigilance

```js
@SelectorProperty({
    name: 'Selector',
    description: 'Select an option',
    category: 'General',
    subcategory: 'eeeeee',
    options: ['opt1', 'opty2', 'third option']
})
myOptions = 0
```

Amaterasu

```js
.addDropDown({
    configName: 'myOptions',
    title: 'Selector',
    description: 'Select an option',
    category: 'General',
    subcategory: 'eeeeee',
    options: ['opt1', 'opty2', 'third option'],
    value: 0
})
```

---

### Slider

Vigilance

```js
@SliderProperty({
    name: 'Slider',
    description: 'Select a value',
    category: 'General',
    subcategory: 'eeeeee',
    min: 0,
    max: 100
})
slider = 0
```

Amaterasu

```js
.addSlider({
    configName: 'slider',
    title: 'Slider',
    description: 'Select a value',
    category: 'General',
    subcategory: 'eeeeee',
    options: [0, 100],
    value: 0
})
```

---

### Decimal Slider

Vigilance

```js
@DecimalSliderProperty({
    name: 'Decimal Slider',
    description: 'Select a value',
    category: 'General',
    subcategory: 'eeeeee',
    minF: 0,
    maxF: 100
})
dSlider = 0
```

Amaterasu

```js
.addSlider({
    configName: 'dSlider',
    title: 'Decimal Slider',
    description: 'Select a value',
    category: 'General',
    subcategory: 'eeeeee',
    options: [0, 100],
    value: 0
})
```

---

### Button

Vigilance

```js
@ButtonProperty({
    name: 'Click me!',
    description: 'yay',
    category: 'General',
    subcategory: 'ooo'
})
activateSomething() {

}
```

Amaterasu

```js
.addButton({
    configName: 'activateSomething',
    title: 'Click me!',
    description: 'yay',
    category: 'General',
    subcategory: 'ooo',
    onClick() {

    }
})
```

---

### Registering Listeners

Vigilance

```js
.registerListener('text', newText => {
    console.log(`Text changed to ${newText}`)
})
```

Amaterasu

```js
.add____({
    configName: 'text',
    /*

    */
    registerListener(oldText, newText) {
        console.log(`Text changed to ${newText}`)
    }
})
// or
[Settings].registerListener('text', (oldText, newText) => {
    console.log(`Text changed to ${newText}`)
})
```

---

### Dependencies

Vigilance

```js
.addDependency('Checkbox', 'Do action!!!')
```

Amaterasu

```js
.add____({
    title: 'Do action!!!',
    /*

    */
    shouldShow: data => data.myCheckbox
})
```

---

### Settings Title

Vigilance

```js
@Vigilant('Vigilance', 'My Settings Title Example',
```

Amaterasu

```js
new Settings('Amaterasu', /**/, /**/, 'My Settings Title Example')
```

---

### Sorting

Vigilance

```js
getCategoryComparator: () => (a, b) => {},
getPropertyComparator: () => (a, b) => {}
```

Amaterasu

```js
[Settings].setElementSort((a, b) => {})
[Settings].setCategorySort((a, b) => {})
```

## Things not in Amaterasu (blame Doc):

- Password/Protected Text Inputs
- Percent Sliders
- Increment on sliders
- Number Input
- Category/Subcategory Descriptions
- Subcategory Sorting

# Credits

Tree Man aka. DocilElm (docilelm) <- wrote Amaterasu (poorly)

Chicken Man (chick_is_bored) <- wrote this readme (poorly)
