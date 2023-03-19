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
#include "Object_C_Interface.h"

/* This is a trivial JNI example where we use a native method
 * to return a new VM String. See the corresponding Java source
 * file located at:
 *
 *   hello-jni/app/src/main/java/com/example/helloaar/MainActivity.java
 */

extern AAssetManager* assetManager;
extern void* nativeHandle;
GameEngine* gameEngine = nullptr;
JavaVM* jvm;
jmethodID playAudio;

extern "C" JNIEXPORT jint JNICALL
Java_com_example_helloaar_MainActivity_onStart(JNIEnv *env, jobject thiz, jobject assetsMgr, jobject surface)
{
    assetManager = AAssetManager_fromJava(env, assetsMgr);
    if(!gameEngine) gameEngine = new GameEngine(ANativeWindow_fromSurface(env, surface), 0);
    else gameEngine->setNativeHandle(ANativeWindow_fromSurface(env, surface));

    env->GetJavaVM(&jvm);
    nativeHandle = env->NewGlobalRef(thiz);
    jclass clazz = env->GetObjectClass(thiz);
    playAudio = env->GetMethodID(clazz, "playAudio", "(Ljava/lang/String;)V");

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
    gameEngine->setNativeHandle(nullptr);

    return 0;
}

bool playNativeAudio(void* object, const char *parameter){
    JNIEnv* env;
    jvm->GetEnv((void**)&env, JNI_VERSION_1_6);

    jstring path = env->NewStringUTF(parameter);
    env->CallVoidMethod( (static_cast<jobject>(object)), playAudio, path);

    return false;
}