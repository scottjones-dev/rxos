import QtQuick
import QtTest
import "../../packages/design-system/qml" as Design

TestCase {
    name: "DesignSystem"

    function create(component, properties) {
        const object = component.createObject(this, properties || {})
        verify(object)
        return object
    }

    function test_day_and_night_token_resolution() {
        const tokens = create(tokensComponent)
        tokens.themeName = "night"
        compare(tokens.background.toString(), "#070a0f")
        tokens.themeName = "day"
        compare(tokens.background.toString(), "#edf2f5")
        verify(tokens.textPrimary.toString() !== tokens.background.toString())
        tokens.destroy()
    }

    function test_profile_defaults_and_overrides() {
        const driver = create(profileComponent, {
            profile: "driver",
            arguments: ["rxos"]
        })
        compare(driver.width, 2560)
        compare(driver.height, 720)
        verify(!driver.touchEnabled)
        driver.destroy()

        const cabin = create(profileComponent, {
            profile: "cabin",
            arguments: ["rxos", "--width", "1600", "--height", "900",
                        "--scale", "1.25", "--density", "220"]
        })
        compare(cabin.width, 1600)
        compare(cabin.height, 900)
        compare(cabin.scale, 1.25)
        compare(cabin.density, 220)
        verify(cabin.touchEnabled)
        cabin.destroy()
    }

    function test_minimum_touch_target_scales() {
        const tokens = create(tokensComponent, { scale: 1.0 })
        const target = create(touchComponent, { theme: tokens })
        verify(target.implicitWidth >= 56)
        verify(target.implicitHeight >= 56)
        tokens.scale = 1.25
        verify(target.implicitWidth >= 70)
        target.destroy()
        tokens.destroy()
    }

    function test_focus_navigation_wraps() {
        const focus = create(focusComponent)
        compare(focus.move(1, 3), 1)
        compare(focus.move(1, 3), 2)
        compare(focus.move(1, 3), 0)
        compare(focus.move(-1, 3), 2)
        focus.destroy()
    }

    function test_back_navigation_and_home() {
        const navigation = create(navigationComponent, { destinationCount: 7 })
        verify(navigation.navigate(3))
        verify(navigation.navigate(5))
        compare(navigation.currentIndex, 5)
        verify(navigation.back())
        compare(navigation.currentIndex, 3)
        navigation.home()
        compare(navigation.currentIndex, 0)
        compare(navigation.history.length, 0)
        navigation.destroy()
    }

    function test_driver_modes() {
        const modes = create(modeComponent)
        verify(modes.select("Performance"))
        compare(modes.mode, "Performance")
        verify(modes.select("Track"))
        compare(modes.mode, "Track")
        verify(!modes.select("Invalid"))
        compare(modes.mode, "Track")
        modes.destroy()
    }

    function test_warning_severity_presentation() {
        const warnings = create(warningComponent, {
            telemetryWarnings: {
                checkEngine: true,
                coolantTemperature: true,
                lowFuel: true,
                lowOilPressure: true
            }
        })
        compare(warnings.activeWarnings.length, 4)
        compare(warnings.mostSevere.severity, "Critical")
        compare(warnings.mostSevere.acknowledgementPolicy,
                "Condition clears only")
        verify(warnings.mostSevere.source.includes("simulated"))
        warnings.destroy()
    }

    function test_reduced_motion_high_contrast_and_widgets() {
        const settings = create(settingsComponent)
        const tokens = create(tokensComponent, {
            reducedMotion: true,
            highContrast: true
        })
        compare(tokens.motionFast, 0)
        compare(tokens.motionStandard, 0)
        compare(tokens.border.toString(), "#dce9f3")
        settings.showMediaWidget = false
        verify(!settings.showMediaWidget)
        settings.destroy()
        tokens.destroy()
    }

    function test_bounded_history_and_gaps_at_sixty_hertz() {
        const history = create(historyComponent, {
            capacity: 600,
            downsampleEvery: 2
        })
        for (let index = 0; index < 36000; index += 1)
            history.append(index * (1000 / 60), index, index % 997 !== 0)
        compare(history.length, 600)
        compare(history.receivedCount, 36000)
        verify(history.values.some(sample => sample.value === null))
        history.destroy()
    }

    Component { id: tokensComponent; Design.RxTokens {} }
    Component { id: profileComponent; Design.DisplayProfiles {} }
    Component { id: touchComponent; Design.RxTouchTarget {} }
    Component { id: focusComponent; Design.FocusNavigator {} }
    Component { id: navigationComponent; Design.NavigationState {} }
    Component { id: modeComponent; Design.DriverModeState {} }
    Component { id: warningComponent; Design.WarningModel {} }
    Component { id: settingsComponent; Design.DisplaySettings {} }
    Component { id: historyComponent; Design.BoundedHistory {} }
}

