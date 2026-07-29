cmake_minimum_required(VERSION 3.21)
project(rxos_desktop_preview VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.5 REQUIRED COMPONENTS Quick QuickControls2)
qt_standard_project_setup(REQUIRES 6.5)

qt_add_executable(rxos-desktop-preview main.cpp)
qt_add_qml_module(rxos-desktop-preview
    URI Rxos.DesktopPreview
    VERSION 1.0
    QML_FILES Main.qml
)
target_link_libraries(rxos-desktop-preview
    PRIVATE Qt6::Quick Qt6::QuickControls2 rxos-design-systemplugin
)
