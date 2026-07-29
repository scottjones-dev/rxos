import QtQuick
import QtTest
import "../../packages/design-system/qml" as Design

TestCase {
    name: "MilestoneOneFive"

    function create(component, properties) {
        const object = component.createObject(this, properties || {})
        verify(object)
        return object
    }

    function test_review_geometry_scale_factors() {
        const geometry = create(geometryComponent, {
            pixelWidth: 2560,
            pixelHeight: 720,
            physicalWidthMm: 640,
            physicalHeightMm: 180
        })
        compare(geometry.xPixels(100), 400)
        compare(geometry.yPixels(45), 180)
        geometry.scaleFactor = 1.5
        compare(geometry.xPixels(100), 600)
        geometry.destroy()
    }

    function test_brightness_hysteresis_and_limits() {
        const brightness = create(brightnessComponent, {
            automatic: true,
            themeName: "day",
            manualLevel: 0.01
        })
        compare(brightness.effectiveLevel, 0.15)
        brightness.updateAmbient(0.2)
        compare(brightness.themeName, "night")
        brightness.updateAmbient(0.3)
        compare(brightness.themeName, "night")
        brightness.updateAmbient(0.5)
        compare(brightness.themeName, "day")
        brightness.destroy()
    }

    function test_rotary_focus_is_bounded_and_isolated() {
        const rotary = create(rotaryComponent, { focusCount: 7 })
        compare(rotary.dispatch("clockwise", "driver"), false)
        compare(rotary.focusIndex, 0)
        rotary.focusIndex = 6
        verify(rotary.dispatch("clockwise", "cabin"))
        compare(rotary.focusIndex, 0)
        verify(rotary.dispatch("anticlockwise", "cabin"))
        compare(rotary.focusIndex, 6)
        rotary.destroy()
    }

    function test_simulated_power_rejects_invalid_transition() {
        const power = create(powerComponent)
        compare(power.transition("running"), false)
        compare(power.state, "off")
        verify(power.transition("accessory"))
        verify(power.transition("ignition-on"))
        verify(power.transition("cranking"))
        verify(power.transition("forced-power-loss"))
        verify(power.transition("recovery"))
        power.destroy()
    }

    Component { id: geometryComponent; Design.ReviewGeometry {} }
    Component { id: brightnessComponent; Design.BrightnessModel {} }
    Component { id: rotaryComponent; Design.RotaryController {} }
    Component { id: powerComponent; Design.SimulatedPowerState {} }
}
