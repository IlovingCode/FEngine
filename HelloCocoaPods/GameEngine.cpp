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
#include <ktxreader/Ktx2Reader.h>

#include <filament/Engine.h>
#include <filament/SwapChain.h>
#include <filament/Renderer.h>
#include <filament/View.h>
#include <filament/Camera.h>
#include <filament/Scene.h>
#include <filament/Viewport.h>
#include <filament/VertexBuffer.h>
#include <filament/IndexBuffer.h>
#include <filament/RenderableManager.h>
#include <filament/Material.h>
#include <filament/MaterialInstance.h>
#include <filament/TransformManager.h>
#include <filament/TextureSampler.h>

#include <utils/Entity.h>
#include <utils/Path.h>
#include <utils/EntityManager.h>

#include <gltfio/math.h>

#include <JavaScriptCore/JavaScriptCore.h>
#include <iostream>
#include <sstream>
#include <fstream>

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

JSGlobalContextRef globalContext;
double current_time;

GameEngine::~GameEngine(){
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
    JSValueRef error = nullptr;
    JSStringRef jsString = JSValueToStringCopy(context, jsValue, &error);
    size_t maxBufferSize = JSStringGetMaximumUTF8CStringSize(jsString);
    char* utf8Buffer = new char[maxBufferSize];
    size_t bytesWritten = JSStringGetUTF8CString(jsString, utf8Buffer, maxBufferSize);
    
    string utf_string = string(utf8Buffer, bytesWritten - 1); // the last byte is a null \0 which std::string doesn't need.
    JSStringRelease(jsString);
    delete [] utf8Buffer;
    return utf_string.compare("null") == 0 ? "" : utf_string;
}

JSCALLBACK(log){
    for (uint8_t i = 0; i < argumentCount; i++) {
        cout << JSValueToStdString(ctx, arguments[i]) << ' ';
    };
    cout << endl;
    return nullptr;
}

JSCALLBACK(beginScene){
    Scene* scene = engine->createScene();
    view->setScene(scene);
    
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

math::float3 eulerAngles(math::quatf q) {
    math::quatf nq = normalize(q);
    return math::float3 {
            // roll (x-axis rotation)
            (atan2(2.0f * (nq.y * nq.z + nq.w * nq.x),
                nq.w * nq.w - nq.x * nq.x - nq.y * nq.y + nq.z * nq.z)),
            // pitch (y-axis rotation)
            (asin(-2.0f * (nq.x * nq.z - nq.w * nq.y))),
            // yaw (z-axis rotation)
            (atan2(2.0f * (nq.x * nq.y + nq.w * nq.z),
                nq.w * nq.w + nq.x * nq.x - nq.y * nq.y - nq.z * nq.z))
    };
}

JSCALLBACK(getWorldTransform){
    JSObjectRef array = JSValueToObject(ctx, arguments[0], nullptr);
//    size_t count = JSObjectGetTypedArrayLength(ctx, array, nullptr);
    void* buffer = JSObjectGetTypedArrayBytesPtr(ctx, array, nullptr);
    Float32* d = static_cast<Float32*>(buffer);
    
    auto& tcm = engine->getTransformManager();
    Entity parent = Entity::import(d[0]);
    
    const math::mat4f world = tcm.getWorldTransform(tcm.getInstance(parent));
    
    math::float3 translation, scale, rotation;
    math::quatf quaternion;
    
    gltfio::decomposeMatrix(world, &translation, &quaternion, &scale);
    
    rotation = eulerAngles(quaternion);
    
    d[1] = translation.x;
    d[2] = translation.y;
    d[3] = translation.z;

    d[4] = scale.x;
    d[5] = scale.y;
    d[6] = scale.z;
    
    d[7] = rotation.x;
    d[8] = rotation.y;
    d[9] = rotation.z;
    
    return arguments[0];
}

JSCALLBACK(loadImage) {
    string filename = JSValueToStdString(ctx, arguments[0]);
    const Path parent = Path::getCurrentExecutable().getParent();
//    cout << (parent + (filename + ".ktx2")) << endl;

    ifstream file(parent + (filename + ".ktx2"), ios::binary);
    const auto contents = vector<uint8_t>((istreambuf_iterator<char>(file)), {});

    ktxreader::Ktx2Reader reader(*engine);

    // Uncompressed formats are lower priority, so they get added last.
    reader.requestFormat(Texture::InternalFormat::SRGB8_A8);
    reader.requestFormat(Texture::InternalFormat::RGBA8);

    Texture* texture = reader.load(contents.data(), contents.size(),
            ktxreader::Ktx2Reader::TransferFunction::sRGB);
    
    return JSObjectMakeArrayBufferWithBytesNoCopy(ctx, texture, sizeof(texture), nullptr, nullptr, nullptr);
}

//Texture* loadImage(string filename) {
//    const Path parent = Path::getCurrentExecutable().getParent();
////    cout << (parent + filename) << endl;
//    ifstream file(parent + filename, ios::binary);
//    const auto contents = vector<uint8_t>((istreambuf_iterator<char>(file)), {});
//
//    ktxreader::Ktx2Reader reader(*engine);
//
//    // Uncompressed formats are lower priority, so they get added last.
//    reader.requestFormat(Texture::InternalFormat::SRGB8_A8);
//    reader.requestFormat(Texture::InternalFormat::RGBA8);
//
//    return reader.load(contents.data(), contents.size(),
//            ktxreader::Ktx2Reader::TransferFunction::sRGB);
//}

JSCALLBACK(updateRenderer) {
    JSObjectRef array = JSValueToObject(ctx, arguments[0], nullptr);
    void* data = JSObjectGetArrayBufferBytesPtr(ctx, array, nullptr);
    VertexBuffer* vb = static_cast<VertexBuffer*>(data);
    
    array = JSValueToObject(ctx, arguments[1], nullptr);
    size_t count = JSObjectGetTypedArrayLength(ctx, array, nullptr);
    data = JSObjectGetTypedArrayBytesPtr(ctx, array, nullptr);
    
    vb->setBufferAt(*engine, 0, VertexBuffer::BufferDescriptor(data, count * 4, nullptr));
    
    return arguments[0];
}

JSCALLBACK(updateMaterial) {
    uint32_t id = JSValueToNumber(ctx, arguments[0], nullptr);
    bool isMask = JSValueToBoolean(ctx, arguments[1]);
    
    auto& rm = engine->getRenderableManager();
    MaterialInstance* material = rm.getMaterialInstanceAt(rm.getInstance(Entity::import(id)), 0);

    material->setDepthWrite(isMask);
    material->setDepthCulling(!isMask);
    material->setColorWrite(!isMask);

    return arguments[0];
}

//JSCALLBACK(updateScissor) {
//    JSObjectRef array = JSValueToObject(ctx, arguments[0], nullptr);
//    size_t count = JSObjectGetTypedArrayLength(ctx, array, nullptr);
//    void* buffer = JSObjectGetTypedArrayBytesPtr(ctx, array, nullptr);
//    uint32_t* d = static_cast<uint32_t*>(buffer);
//
//    uint32_t left = 0, bottom = 0, width = 0, height = 0;
//    if(argumentCount > 1) {
//        left = JSValueToNumber(ctx, arguments[1], nullptr);
//        bottom = JSValueToNumber(ctx, arguments[2], nullptr);
//        width = JSValueToNumber(ctx, arguments[3], nullptr);
//        height = JSValueToNumber(ctx, arguments[4], nullptr);
//    }
//
//    auto& rm = engine->getRenderableManager();
//    for (uint32_t i = 0; i < count; i++) {
//        MaterialInstance* material = rm.getMaterialInstanceAt(rm.getInstance(Entity::import(d[i])), 0);
//
//        if(argumentCount > 1) material->setScissor(left, bottom, width, height);
//        else material->unsetScissor();
//    }
//
//    return arguments[0];
//}

JSCALLBACK(addRenderer){
    uint32_t id = JSValueToNumber(ctx, arguments[0], nullptr);
    Entity entity = Entity::import(id);
    
    JSObjectRef array = JSValueToObject(ctx, arguments[1], nullptr);
    size_t count = JSObjectGetTypedArrayLength(ctx, array, nullptr);
    void* VERTICES = JSObjectGetTypedArrayBytesPtr(ctx, array, nullptr);

    static IndexBuffer *ib, *ib_9;
    static Material *mat;
    
    if(mat == nullptr) {
        static constexpr uint16_t INDICES[6] = { 0, 1, 2, 3, 2, 1 };
        static constexpr uint16_t INDICES_9[54] = {
             0,  1,  2,  3,  2,  1,
             1,  4,  3,  6,  3,  4,
             4,  5,  6,  7,  6,  5,
            10, 11,  0,  1,  0, 11,
            11, 14,  1,  4,  1, 14,
            14, 15,  4,  5,  4, 15,
             8,  9, 10, 11, 10,  9,
             9, 12, 11, 14, 11, 12,
            12, 13, 14, 15, 14, 13,
        };

        // This file is compiled via the matc tool. See the "Run Script" build phase.
        constexpr uint8_t BAKED_COLOR_PACKAGE[] = {
            #include "bakedColor.inc"
        };
        
        mat = Material::Builder()
            .package((void*) BAKED_COLOR_PACKAGE, sizeof(BAKED_COLOR_PACKAGE))
            .build(*engine);
        
        ib = IndexBuffer::Builder()
            .indexCount(6)
            .bufferType(IndexBuffer::IndexType::USHORT)
            .build(*engine);
        ib->setBuffer(*engine, IndexBuffer::BufferDescriptor(INDICES, 12, nullptr));
        
        ib_9 = IndexBuffer::Builder()
            .indexCount(54)
            .bufferType(IndexBuffer::IndexType::USHORT)
            .build(*engine);
        ib_9->setBuffer(*engine, IndexBuffer::BufferDescriptor(INDICES_9, 108, nullptr));
    }
    
    VertexBuffer* vb = VertexBuffer::Builder()
        .vertexCount((uint32_t)count / 4)
        .bufferCount(1)
        .attribute(VertexAttribute::POSITION, 0, VertexBuffer::AttributeType::FLOAT2, 0, 16)
        .attribute(VertexAttribute::UV0, 0, VertexBuffer::AttributeType::FLOAT2, 8, 16)
        .build(*engine);
    vb->setBufferAt(*engine, 0, VertexBuffer::BufferDescriptor(VERTICES, count * 4, nullptr));

    auto matInstance = mat->createInstance();
    matInstance->setDepthCulling(true);
    if(argumentCount > 2) {
        array = JSValueToObject(ctx, arguments[2], nullptr);
        void* data = JSObjectGetArrayBufferBytesPtr(ctx, array, nullptr);
        Texture* texture = static_cast<Texture*>(data);
        matInstance->setParameter("texture", texture, TextureSampler());
    }

    auto ib_t = count > 16 ? ib_9 : ib;
    RenderableManager::Builder(1)
        .boundingBox({{ -1, -1, -1 }, { 1, 1, 1 }})
        .material(0, matInstance)
        .geometry(0, RenderableManager::PrimitiveType::TRIANGLES, vb, ib_t, 0, ib_t->getIndexCount())
        .culling(false)
        .receiveShadows(false)
        .castShadows(false)
        .build(*engine, entity);
    
    return JSObjectMakeArrayBufferWithBytesNoCopy(ctx, vb, sizeof(vb), nullptr, nullptr, nullptr);
}

JSCALLBACK(updateTransforms){
    JSObjectRef array = JSValueToObject(ctx, arguments[0], nullptr);
    size_t count = JSObjectGetTypedArrayLength(ctx, array, nullptr);
    void* buffer = JSObjectGetTypedArrayBytesPtr(ctx, array, nullptr);
    Float32* d = static_cast<Float32*>(buffer);

//    cout << count << endl;
    size_t strike = 10;
//    count /= strike;
    
    auto& tcm = engine->getTransformManager();
    tcm.openLocalTransformTransaction();
    
    for (uint32_t i = 0; i < count; i += strike) {
        uint32_t id = d[i];
        
        math::float3 pos { d[i + 1], d[i + 2], d[i + 3] };
        math::float3 rot { d[i + 4], d[i + 5], d[i + 6] };
        math::float3 scl { d[i + 7], d[i + 8], d[i + 9] };
        
        tcm.setTransform(tcm.getInstance(Entity::import(id)),
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

JSCALLBACK(updateCamera){
    uint32_t id = JSValueToNumber(ctx, arguments[0], nullptr);
    Entity entity = Entity::import(id);
    
    auto camera = engine->getCameraComponent(entity);
    
    const double width = JSValueToNumber(ctx, arguments[1], nullptr);
    const double height = JSValueToNumber(ctx, arguments[2], nullptr);
    
    const double right  =  width * .5;
    const double top    =  height * .5;
    const double left   = -right;
    const double bottom = -top;
    const double near   =  0.0;
    const double far    =  2.0;
    
    camera->setProjection(Camera::Projection::ORTHO, left, right, bottom, top, near, far);
    
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

void GameEngine::input(int16_t x, int16_t y, int16_t state) {
//    cout<< state << endl;
    
    static JSStringRef xStr, yStr, stateStr;
    static JSObjectRef input;
    
    auto viewport = view->getViewport();
    
    x = x - viewport.width / 2;
    y = viewport.height / 2 - y;
    
    if(input == nullptr) {
        JSStringRef inputStr = JSStringCreateWithUTF8CString("input");
        JSObjectRef globalObject = JSContextGetGlobalObject(globalContext);
        xStr = JSStringCreateWithUTF8CString("x");
        yStr = JSStringCreateWithUTF8CString("y");
        stateStr = JSStringCreateWithUTF8CString("state");
        input = JSValueToObject(globalContext, JSObjectGetProperty(globalContext, globalObject, inputStr, nullptr), nullptr);

        JSStringRelease(inputStr);
    }
    
    JSObjectSetProperty(globalContext, input, xStr, JSValueMakeNumber(globalContext, x), kJSPropertyAttributeNone, nullptr);
    JSObjectSetProperty(globalContext, input, yStr, JSValueMakeNumber(globalContext, y), kJSPropertyAttributeNone, nullptr);
    JSObjectSetProperty(globalContext, input, stateStr, JSValueMakeNumber(globalContext, state), kJSPropertyAttributeNone, nullptr);
}

GameEngine::GameEngine(void* nativeWindow){
    engine = Engine::create(Engine::Backend::METAL);
    swapChain = engine->createSwapChain(nativeWindow);
    renderer = engine->createRenderer();
    view = engine->createView();
    
    globalContext = JSGlobalContextCreate(nullptr);
    JSObjectRef globalObject = JSContextGetGlobalObject(globalContext);
    
    registerNativeFunction("beginScene", beginScene, globalObject);
    registerNativeFunction("addCamera", addCamera, globalObject);
    registerNativeFunction("log", log, globalObject);
    registerNativeFunction("createEntity", createEntity, globalObject);
    registerNativeFunction("addRenderer", addRenderer, globalObject);
    registerNativeFunction("updateTransforms", updateTransforms, globalObject);
    registerNativeFunction("updateCamera", updateCamera, globalObject);
    registerNativeFunction("updateRenderer", updateRenderer, globalObject);
    registerNativeFunction("updateMaterial", updateMaterial, globalObject);
    registerNativeFunction("getWorldTransform", getWorldTransform, globalObject);
    registerNativeFunction("loadImage", loadImage, globalObject);
    
    const Path parent = Path::getCurrentExecutable().getParent();
//    cout << (parent + filename) << endl;
    ifstream file(parent + "bundle.js");
    ostringstream buffer;
    buffer << file.rdbuf();
    file.close();
    
    JSStringRef script = JSStringCreateWithUTF8CString(buffer.str().c_str());
//    JSStringRef script = JSStringCreateWithUTF8CString(source);
    JSValueRef exception = nullptr;
    JSEvaluateScript(globalContext, script, nullptr, nullptr, 0, &exception);
    if(exception) cout << JSValueToStdString(globalContext, exception);

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
    
    static JSObjectRef updateLoop;
    
    if(updateLoop == nullptr) {
        JSObjectRef globalObject = JSContextGetGlobalObject(globalContext);
        updateLoop = getScriptFunction("update", globalObject);
    }
    
    JSValueRef exception = nullptr;
    JSObjectCallAsFunction(globalContext, updateLoop, nullptr, 1, &dt, &exception);
    if(exception) cout << JSValueToStdString(globalContext, exception);
    
    render();
}

void GameEngine::resize(uint16_t width, uint16_t height){
    view->setViewport({0, 0, width, height});
    
    JSValueRef args[2] {
        JSValueMakeNumber(globalContext, width),
        JSValueMakeNumber(globalContext, height)
    };
    
    static JSObjectRef resizeView;
    
    if(resizeView == nullptr) {
        JSObjectRef globalObject = JSContextGetGlobalObject(globalContext);
        resizeView = getScriptFunction("resizeView", globalObject);
    }
    
    JSObjectCallAsFunction(globalContext, resizeView, nullptr, 2, args, nullptr);
}
