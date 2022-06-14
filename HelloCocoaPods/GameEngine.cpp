//
//  GameEngine.cpp
//  hello-triangle
//
//  Created by Nguyen Cong Thien on 25/04/2022.
//

#include "GameEngine.hpp"

// TODO: Filament public headers in the 1.8.1 release use DEBUG as a C++ identifier, but Xcode
// defines DEBUG=1. So, we simply undefine it here. This will be fixed in the next release.
#undef DEBUG

// These are all C++ headers, so make sure the type of this file is Objective-C++ source.

#include <filament/Engine.h>
#include <filament/SwapChain.h>
#include <filament/Renderer.h>
#include <filament/View.h>
#include <filament/Camera.h>
#include <filament/Scene.h>
#include <filament/Viewport.h>
#include <filament/TransformManager.h>
#include <filament/RenderableManager.h>

#include "UIView.hpp"
#include <utils/EntityManager.h>

#include <JavaScriptCore/JavaScriptCore.h>

#ifndef JSMACRO
    #define JSMACRO
    #define JSCALLBACK(name) JSValueRef name(JSContextRef ctx, JSObjectRef function, JSObjectRef object, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception)
#endif

using namespace std;
using namespace filament;
using namespace utils;

Engine* engine;
Renderer* renderer;
View* view;
SwapChain* swapChain;
UIVIew* ui;

JSGlobalContextRef globalContext;
JSObjectRef updateLoop;
double current_time;

GameEngine::~GameEngine(){
    delete ui;
    
    engine->destroyCameraComponent(view->getCamera().getEntity());
    view->getScene()->forEach([](Entity e) {
        engine->destroy(e);
    });
    engine->destroy(view->getScene());
    engine->destroy(view);
    engine->destroy(renderer);
    engine->destroy(swapChain);
    engine->destroy(&engine);
    
    JSContextGroupRef contextGroup = JSContextGetGroup(globalContext);
    JSGlobalContextRelease(globalContext);
    JSContextGroupRelease(contextGroup);
}

string JSValueToStdString(JSContextRef context, JSValueRef jsValue) {
    JSStringRef jsString = JSValueToStringCopy(context, jsValue, nullptr);
    size_t maxBufferSize = JSStringGetMaximumUTF8CStringSize(jsString);
    char* utf8Buffer = new char[maxBufferSize];
    size_t bytesWritten = JSStringGetUTF8CString(jsString, utf8Buffer, maxBufferSize);
    string utf_string = string(utf8Buffer, bytesWritten -1); // the last byte is a null \0 which std::string doesn't need.
    JSStringRelease(jsString);
    delete [] utf8Buffer;
    return utf_string;
}

JSCALLBACK(log){
    for (int i = 0; i < argumentCount; i++) {
        cout << JSValueToStdString(ctx, arguments[i]) << ' ';
    };
    cout << endl;
    return nullptr;
}

JSCALLBACK(beginScene){
    view = engine->createView();
    Scene* scene = engine->createScene();
    view->setScene(scene);
    
    ui = new UIVIew(640, 960);
    
    return nullptr;
}

JSCALLBACK(createEntity){
    Entity e = EntityManager::get().create();
    view->getScene()->addEntity(e);

    if(argumentCount > 0) {
        uint32_t id = JSValueToNumber(ctx, arguments[0], nullptr);
        auto& tcm = engine->getTransformManager();
        Entity parent = Entity::import(id);
        tcm.create(e, tcm.getInstance(parent));
//        cout << tcm.getChildCount(tcm.getInstance(parent));
    }
    
    return JSValueMakeNumber(ctx, Entity::smuggle(e));
}

JSCALLBACK(addRenderer){
    uint32_t id = JSValueToNumber(ctx, arguments[0], nullptr);
    
    ui->addSprite(10, 10, JSValueToStdString(ctx, arguments[1]), Entity::import(id));
    
    return arguments[0];
}

JSCALLBACK(updateTransforms){
    JSObjectRef array = JSValueToObject(ctx, arguments[0], nullptr);
    size_t count = JSObjectGetTypedArrayLength(ctx, array, nullptr);
    void* buffer = JSObjectGetTypedArrayBytesPtr(ctx, array, nullptr);
    Float32* d = reinterpret_cast<Float32*>(buffer);

//    cout << count << endl;
    
    size_t strike = 10;
//    count /= strike;
    
    auto& tcm = engine->getTransformManager();
    tcm.openLocalTransformTransaction();
    
    for (unsigned int i = 0; i < count; i += strike) {
        uint32_t id = d[i];
        
        math::float3 pos {d[i + 1], d[i + 2], d[i + 3] };
        math::float3 rot {d[i + 4], d[i + 5], d[i + 6] };
        math::float3 scl {d[i + 7], d[i + 8], d[i + 9] };

        Entity e = Entity::import(id);
        
        tcm.setTransform(tcm.getInstance(e),
            math::mat4f::translation(pos) *
            math::mat4f::eulerZYX(rot.z, rot.y, rot.x) *
            math::mat4f::scaling(scl));
    }
    
    tcm.commitLocalTransformTransaction();
    
    return arguments[0];
}

JSCALLBACK(addCamera){
    uint32_t id = JSValueToNumber(ctx, arguments[0], nullptr);
    Entity entity = Entity::import(id);
    
    view->setPostProcessingEnabled(false);
    Camera* camera = engine->createCamera(entity);
    view->setCamera(camera);
    
    renderer->setClearOptions({.clearColor={0.1, 0.125, 0.25, 1.0}, .clear = true});
    
    return arguments[0];
}

void registerNativeFunction(const char* name, JSObjectCallAsFunctionCallback callback, JSObjectRef thisObject){
    JSStringRef funcName = JSStringCreateWithUTF8CString(name);
    JSObjectRef func = JSObjectMakeFunctionWithCallback(globalContext, funcName, callback);
    JSObjectSetProperty(globalContext, thisObject, funcName, func, kJSPropertyAttributeNone, nullptr);
    JSStringRelease(funcName);
}

JSObjectRef getScriptFunction(const char* name, JSObjectRef thisObject){
    JSStringRef funcName = JSStringCreateWithUTF8CString(name);
    JSValueRef func = JSObjectGetProperty(globalContext, thisObject, funcName, nullptr);
    JSStringRelease(funcName);
    
    return JSValueToObject(globalContext, func, nullptr);
}

void GameEngine::input(uint32_t x, uint32_t y, uint32_t state) {
}

GameEngine::GameEngine(void* nativeWindow, const char* source){
    engine = Engine::create(filament::Engine::Backend::METAL);
    swapChain = engine->createSwapChain(nativeWindow);
    renderer = engine->createRenderer();
    
    globalContext = JSGlobalContextCreate(nullptr);
    JSObjectRef globalObject = JSContextGetGlobalObject(globalContext);
    
    registerNativeFunction("beginScene", beginScene, globalObject);
    registerNativeFunction("addCamera", addCamera, globalObject);
    registerNativeFunction("log", log, globalObject);
    registerNativeFunction("createEntity", createEntity, globalObject);
    registerNativeFunction("addRenderer", addRenderer, globalObject);
    registerNativeFunction("updateTransforms", updateTransforms, globalObject);
    
    JSStringRef script = JSStringCreateWithUTF8CString(source);
    JSValueRef exception = nullptr;
    JSEvaluateScript(globalContext, script, nullptr, nullptr, 0, &exception);
    if(exception) cout << JSValueToStdString(globalContext, exception);
    
    updateLoop = getScriptFunction("update", globalObject);

    JSStringRelease(script);
}

void render(){
    if (renderer->beginFrame(swapChain)) {
        renderer->render(view);
        renderer->endFrame();
    }
}

void GameEngine::update(double now){
    JSValueRef dt = JSValueMakeNumber(globalContext, now - current_time);
    current_time = now;
    
    JSObjectCallAsFunction(globalContext, updateLoop, nullptr, 1, &dt, nullptr);
    render();
}

void GameEngine::resize(uint32_t width, uint32_t height){
    view->setViewport({0, 0, width, height});
    
    const double aspect = (double) width / height;
    constexpr double ZOOM = 10.0;
    
    const double right  =  ZOOM * aspect;
    const double top    =  ZOOM;
    const double left   = -right;
    const double bottom = -top;
    const double near   =  0.0;
    const double far    =  1.0;
    view->getCamera().setProjection(Camera::Projection::ORTHO, left, right, bottom, top, near, far);
}
