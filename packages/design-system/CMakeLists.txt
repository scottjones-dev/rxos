cmake_minimum_required(VERSION 3.21)
project(rxos_design_system VERSION 0.1 LANGUAGES CXX)

find_package(Qt6 6.5 REQUIRED COMPONENTS Quick QuickControls2 WebSockets LinguistTools)

set(CMAKE_AUTOMOC ON)
qt_add_library(rxos-design-system STATIC)

file(GLOB RXOS_DESIGN_QML CONFIGURE_DEPENDS
    "${CMAKE_CURRENT_SOURCE_DIR}/qml/*.qml"
)
foreach(RXOS_QML_FILE IN LISTS RXOS_DESIGN_QML)
    get_filename_component(RXOS_QML_NAME "${RXOS_QML_FILE}" NAME)
    set_source_files_properties(
        "${RXOS_QML_FILE}" PROPERTIES QT_RESOURCE_ALIAS "${RXOS_QML_NAME}"
    )
endforeach()

qt_add_qml_module(rxos-design-system
    URI Rxos.DesignSystem
    VERSION 1.0
    RESOURCE_PREFIX /qt/qml
    QML_FILES ${RXOS_DESIGN_QML}
)

target_link_libraries(rxos-design-system
    PRIVATE Qt6::Quick Qt6::QuickControls2 Qt6::WebSockets
)

qt_add_translations(rxos-design-system
    LRELEASE_OPTIONS -idbased
    TS_FILES
        translations/rxos_en_GB.ts
        translations/rxos_de_DE.ts
        translations/rxos_fr_FR.ts
        translations/rxos_es_ES.ts
        translations/rxos_en_XA.ts
        translations/rxos_ar_XB.ts
    RESOURCE_PREFIX /i18n
)
