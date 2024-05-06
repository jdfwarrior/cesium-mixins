import { JulianDate } from "cesium";
import { Viewer } from "cesium";
import { icons } from "./lib/icons";

function create(type: string, id: string = '', classes: string[] = []) {
  const ele = document.createElement(type);
  if (id) ele.id = id;
  if (classes) ele.classList.add(...classes);
  return ele;
}

function insertStyles() {
  const styleTag = document.createElement('style')
  styleTag.textContent = styles
  document.body.appendChild(styleTag)
}

function createMultiplierSlider(viewer: Viewer) {
  // create the slider that will adjust playback speed
  const slider = create('input') as HTMLInputElement
  const label = create('label') as HTMLLabelElement
  const { multiplier } = viewer.clock
  slider.type = 'range'
  slider.min = '1'
  slider.max = '300'
  slider.value = multiplier.toString()
  label.textContent = `${multiplier}x`

  slider.onchange = () => {
    viewer.clock.multiplier = +slider.value
    label.textContent = `${multiplier}x`
  }

  return [slider, label]
}

function createPlaybackSpeedButton(viewer: Viewer) {
  let visible = false
  const wrapper = create('div', '', ['widget-wrapper', 'playback-multiplier-wrapper'])
  const btn = create("button", "", ["animation-control-btn"]);
  btn.innerHTML = icons.get('speed')!

  function updatePlaybackTooltip() {
    const { multiplier } = viewer.clock
    btn.title = `Playback Speed (${multiplier}x)`
  }

  const [slider, label] = createMultiplierSlider(viewer)
  wrapper.appendChild(slider)
  wrapper.appendChild(label)

  btn.onclick = () => {
    if (!visible) document.body.appendChild(wrapper)
    else document.body.removeChild(wrapper)
    visible = !visible
  }

  wrapper.onmouseleave = () => {
    document.body.removeChild(wrapper)
    visible = false
    updatePlaybackTooltip()
  }

  updatePlaybackTooltip()

  return btn
}

function createPlayPauseButton(viewer: Viewer) {
  const btn = create("button", "", ["animation-control-btn"]);
  btn.innerHTML = icons.get('play')!
  btn.title = 'Play/Pause'
  btn.onclick = () => onPlayPause();

  function updatePlayPauseIcon() {
    if (viewer.clock.shouldAnimate) btn.innerHTML = icons.get('pause')!;
    else btn.innerHTML = icons.get('play')!;
  }

  function onPlayPause() {
    viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate;
    updatePlayPauseIcon()
  }

  viewer.timeline.container.addEventListener('click', updatePlayPauseIcon)

  return btn
}

function createNowButton(viewer: Viewer) {
  const btn = create("button", "", ["animation-control-btn"]);
  // set content and tooltip
  btn.innerHTML = icons.get('clock')!;
  btn.title = 'Set current time to now'

  btn.onclick = () => {
    viewer.clock.currentTime = JulianDate.fromDate(new Date())
  }

  return btn
}

function createTimeLabel(viewer: Viewer) {
  const label = create("div");
  function onTick() {
    label.textContent = `${viewer.animation.viewModel.dateLabel} ${viewer.animation.viewModel.timeLabel}`
  }
  viewer.clockViewModel.clock.onTick.addEventListener(onTick);

  return label
}

export default function (viewer: Viewer) {
  insertStyles()
  viewer.clock.multiplier = 100

  const wrapper = create("div", "", ["widget-wrapper", "animation-controls"]);
  const multiplier = createPlaybackSpeedButton(viewer)
  const play = createPlayPauseButton(viewer)
  const now = createNowButton(viewer)
  const time = createTimeLabel(viewer)
  const controls = [multiplier, now, play, time];

  controls.forEach((control) => wrapper.appendChild(control));
  document.body.appendChild(wrapper);
}

const styles = `
.widget-wrapper {
  display: flex;
  justify-content: start;
  align-items: center;
  column-gap: 8px;
  height: 30px;
  background-color: rgba(49 51 54 / 60%);
  border: 1px solid #444444;
  border-radius: 15px;
  color: #edffff;
  padding-left: 8px;
  padding-right: 8px;
  font-size: 13px;
  box-sizing: border-box;
}

.animation-controls {
  position: absolute;
  bottom: 8px;
  left: 8px;
}

.animation-control-btn {
  padding: 0;
  margin: 0;
  height: 24px;
  background: transparent;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border:none;
  outline: none;
}

.animation-control-btn:focus {
  border: none;
  outline: none;
}

.playback-multiplier-wrapper {
  position: absolute;
  bottom: 46px;
  left: 8px;
  width: 251px;
}

.playback-multiplier-wrapper > input{
  flex-grow: 1; 
}

.cesium-viewer-timelineContainer {
  background-color: rgba(49 51 54 / 60%) !important;
  border-radius: 15px !important;
  bottom: 8px !important;
  left: 265px !important;
  right: 8px !important;
  height: 30px !important;
  border: 1px solid #444444;
  box-sizing: border-box;
}

.cesium-timeline-main {
  border: none !important;
  height: 30px !important;
}

.cesium-timeline-bar {
  background: none !important;
  height: 30px !important;
}

.cesium-timeline-trackContainer {
  border: none !important;
}

/* .cesium-timeline-needle {
  display: none !important;
} */

.cesium-viewer-animationContainer {
  display: none !important;
}

.cesium-timeline-ticLabel {
  top: 0px !important;
}
`