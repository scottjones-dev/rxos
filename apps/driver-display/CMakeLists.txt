cmake_minimum_required(VERSION 3.21)
project(rxos_driver_display VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.5 REQUIRED COMPONENTS Quick QuickControls2 WebSockets)
qt_standard_project_setup(REQUIRES 6.5)

qt_add_executable(rxos-driver-display main.cpp)
target_include_directories(rxos-driver-display PRIVATE "${CMAKE_SOURCE_DIR}/tooling")

file(GLOB RXOS_DRIVER_QML CONFIGURE_DEPENDS
    "${CMAKE_CURRENT_SOURCE_DIR}/*.qml"
)
foreach(RXOS_QML_FILE IN LISTS RXOS_DRIVER_QML)
    get_filename_component(RXOS_QML_NAME "${RXOS_QML_FILE}" NAME)
    set_source_files_properties(
        "${RXOS_QML_FILE}" PROPERTIES QT_RESOURCE_ALIAS "${RXOS_QML_NAME}"
    )
endforeach()
qt_add_qml_module(rxos-driver-display
    URI Rxos.DriverDisplay
    VERSION 1.0
    QML_FILES ${RXOS_DRIVER_QML}
)

target_link_libraries(rxos-driver-display
    PRIVATE
        Qt6::Quick
        Qt6::QuickControls2
        Qt6::WebSockets
        rxos-design-systemplugin
)

install(TARGETS rxos-driver-display
    BUNDLE DESTINATION .
    RUNTIME DESTINATION bin
)
