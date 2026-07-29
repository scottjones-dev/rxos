cmake_minimum_required(VERSION 3.21)
project(rxos_driver_display VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.5 REQUIRED COMPONENTS Quick QuickControls2 WebSockets)
qt_standard_project_setup(REQUIRES 6.5)

qt_add_executable(rxos-driver-display main.cpp)

set(RXOS_TELEMETRY_STATE
    "${CMAKE_SOURCE_DIR}/packages/design-system/qml/TelemetryState.qml"
)
set(RXOS_TELEMETRY_STORE
    "${CMAKE_SOURCE_DIR}/packages/design-system/qml/TelemetryStore.qml"
)
set_source_files_properties(
    "${RXOS_TELEMETRY_STATE}"
    PROPERTIES QT_RESOURCE_ALIAS TelemetryState.qml
)
set_source_files_properties(
    "${RXOS_TELEMETRY_STORE}"
    PROPERTIES QT_RESOURCE_ALIAS TelemetryStore.qml
)

qt_add_qml_module(rxos-driver-display
    URI Rxos.DriverDisplay
    VERSION 1.0
    QML_FILES Main.qml "${RXOS_TELEMETRY_STATE}" "${RXOS_TELEMETRY_STORE}"
)

target_link_libraries(rxos-driver-display
    PRIVATE Qt6::Quick Qt6::QuickControls2 Qt6::WebSockets
)

install(TARGETS rxos-driver-display
    BUNDLE DESTINATION .
    RUNTIME DESTINATION bin
)
