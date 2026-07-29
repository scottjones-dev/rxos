cmake_minimum_required(VERSION 3.21)
project(rxos_displays VERSION 0.1 LANGUAGES CXX)

enable_testing()
add_subdirectory(apps/driver-display)
add_subdirectory(apps/cabin-display)

find_program(QMLTESTRUNNER_EXECUTABLE qmltestrunner REQUIRED)
find_program(NODE_EXECUTABLE node REQUIRED)

add_test(
    NAME qml-telemetry-state
    COMMAND "${QMLTESTRUNNER_EXECUTABLE}"
        -input "${CMAKE_SOURCE_DIR}/tests/qml"
        -platform offscreen
)

set(RXOS_RELIABILITY_RUNNER
    "${CMAKE_SOURCE_DIR}/apps/vehicle-simulator/dist/src/display-reliability-runner.js"
)
add_test(
    NAME driver-display-reliability
    COMMAND "${NODE_EXECUTABLE}" "${RXOS_RELIABILITY_RUNNER}"
        "$<TARGET_FILE:rxos-driver-display>"
)
add_test(
    NAME cabin-display-reliability
    COMMAND "${NODE_EXECUTABLE}" "${RXOS_RELIABILITY_RUNNER}"
        "$<TARGET_FILE:rxos-cabin-display>"
)
add_test(
    NAME driver-display-profile
    COMMAND "$<TARGET_FILE:rxos-driver-display>"
        --smoke-test --width 2560 --height 720 --scale 1.0 --density 170
)
add_test(
    NAME cabin-display-profile
    COMMAND "$<TARGET_FILE:rxos-cabin-display>"
        --smoke-test --width 1920 --height 1080 --scale 1.0 --density 170
)

set_tests_properties(
    qml-telemetry-state
    driver-display-reliability
    cabin-display-reliability
    driver-display-profile
    cabin-display-profile
    PROPERTIES
        ENVIRONMENT "QT_QPA_PLATFORM=offscreen;QSG_RHI_BACKEND=software"
        RUN_SERIAL TRUE
        TIMEOUT 20
)
