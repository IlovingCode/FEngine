
#
# Copyright (C) The Android Open Source Project
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

cmake_minimum_required(VERSION 3.18)

option(FILAMENT_SUPPORTS_VULKAN "Enables Vulkan on Android" OFF)

# configure import libs
set(libs_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../../libs)
set(FILAMENT_DIR ${libs_DIR}/filament)

add_library(filament STATIC IMPORTED)
set_target_properties(filament PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libfilament.a)

add_library(spine-cpp STATIC IMPORTED)
set_target_properties(spine-cpp PROPERTIES IMPORTED_LOCATION
        ${libs_DIR}/spine/lib/${ANDROID_ABI}/libspine-cpp.a)

add_library(backend STATIC IMPORTED)
set_target_properties(backend PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libbackend.a)

add_library(utils STATIC IMPORTED)
set_target_properties(utils PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libutils.a)

add_library(ibl-lite STATIC IMPORTED)
set_target_properties(ibl-lite PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libibl-lite.a)

add_library(filaflat STATIC IMPORTED)
set_target_properties(filaflat PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libfilaflat.a)

add_library(filamat STATIC IMPORTED)
set_target_properties(filamat PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libfilamat.a)

add_library(geometry STATIC IMPORTED)
set_target_properties(geometry PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libgeometry.a)

add_library(filabridge STATIC IMPORTED)
set_target_properties(filabridge PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libfilabridge.a)

add_library(bluevk STATIC IMPORTED)
set_target_properties(bluevk PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libbluevk.a)

add_library(vkshaders STATIC IMPORTED)
set_target_properties(vkshaders PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libvkshaders.a)

add_library(smol-v STATIC IMPORTED)
set_target_properties(smol-v PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libsmol-v.a)

add_library(ktxreader STATIC IMPORTED)
set_target_properties(ktxreader PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libktxreader.a)

add_library(basis_transcoder STATIC IMPORTED)
set_target_properties(basis_transcoder PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libbasis_transcoder.a)

add_library(zstd STATIC IMPORTED)
set_target_properties(zstd PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libzstd.a)

add_library(stb STATIC IMPORTED)
set_target_properties(stb PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libstb.a)

add_library(image STATIC IMPORTED)
set_target_properties(image PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libimage.a)

add_library(uberarchive STATIC IMPORTED)
set_target_properties(uberarchive PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libuberarchive.a)

add_library(uberzlib STATIC IMPORTED)
set_target_properties(uberzlib PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libuberzlib.a)

add_library(dracodec STATIC IMPORTED)
set_target_properties(dracodec PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libdracodec.a)

add_library(meshoptimizer STATIC IMPORTED)
set_target_properties(meshoptimizer PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libmeshoptimizer.a)

add_library(gltfio STATIC IMPORTED)
set_target_properties(gltfio PROPERTIES IMPORTED_LOCATION
        ${FILAMENT_DIR}/lib/${ANDROID_ABI}/libgltfio_core.a)

# ${ANDROID_ABI} is handy for our purpose here. Probably this ${ANDROID_ABI} is
# the most valuable thing of this sample, the rest are pretty much normal cmake
add_library(jsc SHARED IMPORTED)
set_target_properties(jsc PROPERTIES IMPORTED_LOCATION
        ${libs_DIR}/jsc/lib/${ANDROID_ABI}/libjsc.so)

# build application's shared lib
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17 -fno-rtti")

add_definitions("-DANDROID")
add_library(Test SHARED GameEngine.cpp Test.cpp)

target_include_directories(Test PRIVATE
        ..
        ${libs_DIR}/jsc
        ${libs_DIR}/filament/include
        ${libs_DIR}/spine/include)

target_link_libraries(Test
        PRIVATE jsc
        PRIVATE filament
        PRIVATE spine-cpp
        PRIVATE backend
        PRIVATE filaflat
        PRIVATE filabridge
        PRIVATE ibl-lite
        PRIVATE log
        PRIVATE GLESv3
        PRIVATE EGL
        PRIVATE bluevk
        PRIVATE vkshaders
        PRIVATE android
        PRIVATE jnigraphics
        PRIVATE utils
        PRIVATE smol-v
        PRIVATE zstd
        PRIVATE image
        PRIVATE stb
        PRIVATE uberarchive
        PRIVATE uberzlib
        PRIVATE dracodec
        PRIVATE meshoptimizer
        PRIVATE gltfio
        PRIVATE basis_transcoder
        PRIVATE ktxreader
        PUBLIC geometry)