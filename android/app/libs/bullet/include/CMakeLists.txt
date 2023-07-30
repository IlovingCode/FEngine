
# IF(BUILD_BULLET3)
# 	SUBDIRS(  Bullet3OpenCL Bullet3Serialize/Bullet2FileLoader Bullet3Dynamics Bullet3Collision Bullet3Geometry )
# ENDIF(BUILD_BULLET3)


# SUBDIRS(   BulletInverseDynamics BulletSoftBody BulletCollision BulletDynamics LinearMath Bullet3Common)


# IF(INSTALL_LIBS)
# 	#INSTALL of other files requires CMake 2.6
# 	IF (${CMAKE_MAJOR_VERSION}.${CMAKE_MINOR_VERSION} GREATER 2.5)
# 		IF (APPLE AND BUILD_SHARED_LIBS AND FRAMEWORK)
# 			# Don't actually need to install any common files, the frameworks include everything
# 		ELSE (APPLE AND BUILD_SHARED_LIBS AND FRAMEWORK)
# 			INSTALL(FILES btBulletCollisionCommon.h btBulletDynamicsCommon.h  DESTINATION ${INCLUDE_INSTALL_DIR})
# 		ENDIF (APPLE AND BUILD_SHARED_LIBS AND FRAMEWORK)
# 	ENDIF (${CMAKE_MAJOR_VERSION}.${CMAKE_MINOR_VERSION} GREATER 2.5)
# ENDIF(INSTALL_LIBS)

cmake_minimum_required(VERSION 3.18)
project(bullet)

set(CMAKE_OSX_SYSROOT /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk)

INCLUDE_DIRECTORIES(${CMAKE_CURRENT_SOURCE_DIR})

file(GLOB COLLISION_INCLUDES "BulletCollision/**/*.h")
file(GLOB COLLISION_SOURCES "BulletCollision/**/*.cpp")

file(GLOB DYNAMICS_INCLUDES "BulletDynamics/**/*.h")
file(GLOB DYNAMICS_SOURCES "BulletDynamics/**/*.cpp")

file(GLOB LINEARMATH_INCLUDES "LinearMath/**/*.h")
file(GLOB LINEARMATH_SOURCES "LinearMath/**/*.cpp")

set (CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -std=gnu11 -ffast-math")
set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -ffast-math")

add_library(LinearMath STATIC ${LINEARMATH_SOURCES} ${LINEARMATH_INCLUDES})
add_library(BulletCollision STATIC ${COLLISION_SOURCES} ${COLLISION_INCLUDES})
add_library(BulletDynamics STATIC ${DYNAMICS_SOURCES} ${DYNAMICS_INCLUDES})


add_library(bullet STATIC btLinearMathAll.cpp btBulletCollisionAll.cpp btBulletDynamicsAll.cpp)
target_link_libraries(bullet 
            PRIVATE BulletDynamics
            PRIVATE BulletCollision
            PRIVATE LinearMath
            )