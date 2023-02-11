/*
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
#include <jni.h>
#include <android/asset_manager_jni.h>
#include <android/native_window_jni.h>
#include "GameEngine.hpp"

/* This is a trivial JNI example where we use a native method
 * to return a new VM String. See the corresponding Java source
 * file located at:
 *
 *   hello-jni/app/src/main/java/com/example/helloaar/MainActivity.java
 */

extern AAssetManager* assetManager;
GameEngine* gameEngine;

extern "C" JNIEXPORT jint JNICALL
Java_com_example_helloaar_MainActivity_onStart(JNIEnv *env, jobject thiz, jobject assetsMgr, jobject surface)
{
    assetManager = AAssetManager_fromJava(env, assetsMgr);
    gameEngine = new GameEngine(ANativeWindow_fromSurface(env, surface));

    return 0;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_example_helloaar_MainActivity_onResize(JNIEnv *env, jobject thiz, jint width, jint height)
{
    gameEngine->resize(width, height);

    return 0;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_example_helloaar_MainActivity_onUpdate(JNIEnv *env, jobject thiz, jlong time)
{
    gameEngine->update(time * 1e-9);

    return 0;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_example_helloaar_MainActivity_onInput(JNIEnv *env, jobject thiz, jfloat x, jfloat y, jint state)
{
    gameEngine->input(x, y, state);

    return 0;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_example_helloaar_MainActivity_onFinish(JNIEnv *env, jobject thiz)
{
    delete gameEngine;

    return 0;
}