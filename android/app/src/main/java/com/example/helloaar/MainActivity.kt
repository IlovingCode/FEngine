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
 */
package com.example.helloaar

import android.app.Activity
import android.content.res.AssetManager
import android.os.Bundle
import android.util.Log
import android.view.*
import android.view.Choreographer.FrameCallback
import android.view.SurfaceHolder.Callback
import android.view.ViewGroup.LayoutParams

class MainActivity : Activity(), Callback, FrameCallback {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        /*
         * Retrieve our TextView and set its content.
         * the text is retrieved by calling a native
         * function.
         */

        var surfaceView = SurfaceView(this)
        setContentView(surfaceView)
        surfaceView.setZOrderOnTop(true)

        surfaceView.holder.addCallback(this)
    }

    /*
     * A native method that is implemented by the
     * 'hello-jni' native library, which is packaged
     * with this application.
     */
    external fun onStart(assetManager: AssetManager, surface: Surface): Int
    external fun onResize(width: Int, height: Int): Int
    external fun onUpdate(time: Long): Int
    external fun onInput(x: Float, y: Float, state: Int): Int
    external fun onFinish(): Int

    /*
     * This is another native method declaration that is *not*
     * implemented by 'hello-jni'. This is simply to show that
     * you can declare as many native methods in your Java code
     * as you want, their implementation is searched in the
     * currently loaded native libraries only the first time
     * you call them.
     *
     * Trying to call this function will result in a
     * java.lang.UnsatisfiedLinkError exception !
     */
//    external fun unimplementedStringFromJNI(): String?

    companion object {
        /*
         * this is used to load the 'hello-jni' library on application
         * startup. The library has already been unpacked into
         * /data/data/com.example.hellojni/lib/libhello-jni.so
         * at the installation time by the package manager.
         */
        init {
            System.loadLibrary("Test")
        }
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
//        TODO("Not yet implemented")

        onStart(assets, holder.surface)

        Choreographer.getInstance().postFrameCallback(this)
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
//        TODO("Not yet implemented")
//        Log.i("Thien", "$width $height")
        onResize(width, height)
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
//        TODO("Not yet implemented")
        onFinish()
    }

    override fun doFrame(frameTimeNanos: Long) {
//        TODO("Not yet implemented")
        Choreographer.getInstance().postFrameCallback(this)

        onUpdate(frameTimeNanos)
    }


    override fun onTouchEvent(event: MotionEvent): Boolean {
        Log.i("Thien", "${event.x} ${event.y}");

        onInput(event.x, event.y, when (event.action) {
            MotionEvent.ACTION_DOWN -> 0
            MotionEvent.ACTION_MOVE -> 1
            else -> 3
        })
        return true
    }
}