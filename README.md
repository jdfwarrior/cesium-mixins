# cesium-mixins

A collection of various Cesium mixins

## selection

![Selection](https://github.com/jdfwarrior/cesium-mixins/blob/main/img/select.png?raw=true "Selection")

The `selection` mixin allows you to call a function and then click two points on the globe, interactively drawing a rectangle, and will return an array of all of the entities that were found to be within the boundaries of the drawn rectangle.

This currently only works with entities that have a defined singular location, so, no `wall`, `rectangle`, `polygon`, `polyline volume`, etc that have multiple points to define their shape, _unless_ you also defined a center location on that entity using the top level `position` property.

### Example

```
import {selection} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(selection)

...

const selectedEntities = await viewer.select() // list of entities that were within the draw rectangle
```

## pick location

![Pick Location](https://github.com/jdfwarrior/cesium-mixins/blob/main/img/pick-location.png?raw=true "Pick Location")

The `pickLocation` mixin allows you to call a function and have a promise that will resolve the current `CartographicDegrees` position that the user clicked on the globe.

If the user presses `Escape`, the promise will resolve to `undefined`.

### Example

```
import {pickLocation} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(pickLocation)

...

const position = await viewer.pickLocation() // resolves to the cartographic location that the user clicks on the globe
```

## pick entity

![Pick Entity](https://github.com/jdfwarrior/cesium-mixins/blob/main/img/pick-entity.png?raw=true "Pick Entity")

The `pickEntity` mixin allows you to call a function and have a promise that will resolve the entities that exist at the position that the user clicked on the globe.

If the user presses `Escape`, the promise will resolve to `undefined`.

### Example

```
import {pickEntity} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(pickEntity)

...

const position = await viewer.pickEntity() // resolves to the entity at the location that the user clicks on the globe
const position = await viewer.pickEntity(true) // resolves multiple entities at the location that the user clicks on the globe
```

## cursor location

![Cursor](https://github.com/jdfwarrior/cesium-mixins/blob/main/img/cursor.png?raw=true "Cursor")

The `cursor` mixin creates a helper ui tool in the top left of the canvas that will show the current cursor location in cartographic degrees. You can also click on the tool and switch the units between MGRS and UTM

### Example

```
import {cursor} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(cursor)

viewer.mousecursor.show()
viewer.mousecursor.hide()
viewer.mousecursor.units.set('mgrs')
viewer.mousecursor.units.add('custom', (latitude, longitude) => string)
```

## tooltip

![Tooltip](https://github.com/jdfwarrior/cesium-mixins/blob/main/img/tooltip.png?raw=true "Tooltip")

The `tooltip` mixin watches the mouse cursor position and when the user mouses over an entity, will display a small tooltip beside the entity, with its name. When the user move the mouse away from the entity, the tooltip disappears

### Example

```
import {tooltip} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(tooltip)

viewer.tooltips.show()
viewer.tooltips.hide()
viewer.tooltips.toggle()
```

## animation controls

![Animation Controls](https://github.com/jdfwarrior/cesium-mixins/blob/main/img/controls.png?raw=true "Animation Controls")

The `animation controls` (beta) mixin switches out the dated animation controller for something that looks a little better.

### Example

```
import {controls} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(controls)
```

## measure

![Measure](https://github.com/jdfwarrior/cesium-mixins/blob/main/img/measure.png?raw=true "Measure")

The `measure` mixin allows the user to click and measure the distance between two points on the globe. The function call will return a Promise that resolves to an object with the `CartographicDegrees` location of each click and the measured distance in `meters`, `miles`, and `kilometers`

### Example

```
import {measure} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(measure)

viewer.measure()
```

## draw circle

![Draw Circle](https://github.com/jdfwarrior/cesium-mixins/blob/main/img/draw-circle.png?raw=true "Draw Circle")

The `drawcircle` mixin allows the user to click to set an initial point and then move the mouse cursor and draw a circle. The radius of the circle will be shown in a ui helper at the top of the screen. The function call will return a Promise that resolves to an object with the initial center point in `CartographicDegrees` and the radius of the drawn circle

### Example

```
import {drawcircle} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(drawcircle)

viewer.drawcircle()
```

## draw polygon

![Draw Polygon](https://github.com/jdfwarrior/cesium-mixins/blob/main/img/draw-polygon.png?raw=true "Draw Polygon")

The `drawpolygon` mixin allows the user to click a group of points that define a polygon on the globe. The function call will return a Promise that resolves to an array of `CartographicDegrees` used to define the corners.

### Example

```
import {drawpolygon} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(drawpolygon)

viewer.drawpolygon()
```

## countries

The `countries` mixin allows you to show country labels or country borders on the globe easily. Antarctica was intentionally removed from the country borders for performance reasons. Future improvements will allow you to set the outline color of the country borders and whether or not the countries are filled. You'll also be able to set background color of the country labels, whether or not they have a background, and text color.

### Example

```
import {countries} from '@jdfwarrior/cesium-mixins'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(countries)

viewer.countries.labels.show()
viewer.countries.labels.hide()
viewer.countries.labels.toggle()

viewer.countries.borders.show()
viewer.countries.borders.hide()
viewer.countries.borders.toggle()
```

## saved views

Accessible via the API or using hotkeys. `Ctrl+H` will return to the designated "home" view. `Ctrl+L` will save the current camera view to the saved view collection. `Ctrl+K` will navigate to the next saved view in the collection. `Ctrl+J` will navigate to the previous saved view in the collection.

### Api

Available on the `Viewer` instance as `savedviews`, the `SavedViewCollection` has several functions that allow you to manage your saved views.

### .add()

Allows you to add the current camera view to the collection as a saved view.

### .getById(id: string)

Get the saved view that matches the provided id

### .remove(view: SavedView)

Remove the specified view from collection

### .removeById(id: string)

Remove the saved view with the provided id from the collection

### .removeAll()

Remove all saved views from the collection

### .goto(view: SavedView)

Fly to the specified saved view on the globe

### .home()

Fly to the user selected home view if set, if not, fly to the default home view.

### .previousView()

Fly to the previous view in the collection

### .nextView()

Fly to the next view in the collection

### .setHome(view: SavedView)

Set the provided saved view as the user selected home view

### .resetHome()

Reset the user selected home view
