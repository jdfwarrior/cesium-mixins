# cesium-mixins

A collection of various Cesium mixins

## selection

![Selection](./img/select.png "Selection")

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

![Pick Location](./img/pick-location.png "Pick Location")

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

![Pick Entity](./img/pick-entity.png "Pick Entity")

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

![Cursor](./img/cursor.png "Cursor")

The `cursor` mixin creates an additional property on the viewer instance that will emit a `CartographicDegrees` location as the user moves the mouse around the globe.

You can also pass a configuration object to the mixin when initialized that will at a small block to th etop left corner of the window, showing the current mouse location
at all times.

### Example

```
import {cursor} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(cursor) // default use, just adds the emitter to the viewer instance
viewer.extend(cursor, {ui: true}) // adds ui to the canvas that will display the cursor position

...

viewer.cursor.addEventListener(console.log) // console logs the mouse cursor position in cartographic degrees
```

## tooltip

![Tooltip](./img/tooltip.png "Tooltip")

The `tooltip` mixin watches the mouse cursor position and when the user mouses over an entity, will display a small tooltip beside the entity, with its name. When the user move the mouse away from the entity, the tooltip disappears

### Example

```
import {tooltip} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(tooltip)
```

## animation controls

![Animation Controls](./img/animation-controls.png "Animation Controls")

The `animation controls` (beta) mixin switches out the dated animation controller for something that looks a little better.

### Example

```
import {controls} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(controls)
```

## measure

![Measure](./img/measure.png "Measure")

The `measure` mixin allows the user to click and measure the distance between two points on the globe

### Example

```
import {measure} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(measure)

viewer.measure()
```

## draw circle

![Draw Circle](./img/drawcircle.png "Draw Circle")

The `drawcircle` mixin allows the user to click to set an initial point and then move the mouse cursor and draw a circle. The radius of the circle will be shown in a ui helper at the top of the screen.

### Example

```
import {drawcircle} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(drawcircle)

viewer.drawcircle()
```

## draw polygon

![Draw Polygon](./img/draw-polygon.png "Draw Polygon")

The `drawpolygon` mixin allows the user to click a group of points that define a polygon on the globe.

### Example

```
import {drawpolygon} from '@jdfwarrior/cesium-utils'
import {Viewer} from 'cesium'

const viewer = new Viewer('cesium')
viewer.extend(drawpolygon)

viewer.drawpolygon()
```

## Todo

- Update screenshots