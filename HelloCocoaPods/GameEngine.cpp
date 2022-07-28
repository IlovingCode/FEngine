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

//struct Vertex {
//    filament::math::float2 position;
//    filament::math::float2 uv;
//};

struct Input {
    uint32_t x;
    uint32_t y;
    int state;
};

Engine* engine;
Renderer* renderer;
View* view;
SwapChain* swapChain;
VertexBuffer* vb;

JSGlobalContextRef globalContext;
JSObjectRef updateLoop;
JSObjectRef resizeView;
double current_time;
Input input;

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

Texture* loadImage(string filename) {
    const Path parent = Path::getCurrentExecutable().getParent();
//    cout << (parent + filename) << endl;
    ifstream file(parent + filename, ios::binary);
    const auto contents = vector<uint8_t>((istreambuf_iterator<char>(file)), {});

    ktxreader::Ktx2Reader reader(*engine);

    // Uncompressed formats are lower priority, so they get added last.
    reader.requestFormat(Texture::InternalFormat::SRGB8_A8);
    reader.requestFormat(Texture::InternalFormat::RGBA8);

    return reader.load(contents.data(), contents.size(),
            ktxreader::Ktx2Reader::TransferFunction::sRGB);
}

JSCALLBACK(updatteMaterial) {
    JSObjectRef array = JSValueToObject(ctx, arguments[1], nullptr);
    void* VERTICES = JSObjectGetTypedArrayBytesPtr(ctx, array, nullptr);
    vb->setBufferAt(*engine, 0, VertexBuffer::BufferDescriptor(VERTICES, 64, nullptr));
    
    return arguments[0];
}

JSCALLBACK(addRenderer){
    uint32_t id = JSValueToNumber(ctx, arguments[0], nullptr);
    Entity entity = Entity::import(id);
    
//    float width = JSValueToNumber(ctx, arguments[1], nullptr) * .5f;
//    float height = JSValueToNumber(ctx, arguments[2], nullptr) * .5f;
    
//    const Vertex* VERTICES = new Vertex[4] {
//        {{-width, -height}, {0, 0}},
//        {{ width, -height}, {1, 0}},
//        {{-width,  height}, {0, 1}},
//        {{ width,  height}, {1, 1}},
//    };
    
//    const float* VERTICES = new float[16] {
//        -width, -height, 0, 0,
//         width, -height, 1, 0,
//        -width,  height, 0, 1,
//         width,  height, 1, 1,
//    };
    
    JSObjectRef array = JSValueToObject(ctx, arguments[1], nullptr);
    void* VERTICES = JSObjectGetTypedArrayBytesPtr(ctx, array, nullptr);
//    Float32* VERTICES = reinterpret_cast<Float32*>(buffer);

    static constexpr uint16_t INDICES[6] = { 0, 1, 2, 3, 2, 1 };

    // This file is compiled via the matc tool. See the "Run Script" build phase.
    static constexpr uint8_t BAKED_COLOR_PACKAGE[] = {
        #include "bakedColor.inc"
    };
    
    static Material* const mat = Material::Builder()
        .package((void*) BAKED_COLOR_PACKAGE, sizeof(BAKED_COLOR_PACKAGE))
        .build(*engine);
    
    vb = VertexBuffer::Builder()
        .vertexCount(4)
        .bufferCount(1)
        .attribute(VertexAttribute::POSITION, 0, VertexBuffer::AttributeType::FLOAT2, 0, 16)
        .attribute(VertexAttribute::UV0, 0, VertexBuffer::AttributeType::FLOAT2, 8, 16)
        .build(*engine);
    vb->setBufferAt(*engine, 0, VertexBuffer::BufferDescriptor(VERTICES, 64, nullptr));

    static IndexBuffer* const ib = IndexBuffer::Builder()
        .indexCount(6)
        .bufferType(IndexBuffer::IndexType::USHORT)
        .build(*engine);
    ib->setBuffer(*engine, IndexBuffer::BufferDescriptor(INDICES, 12, nullptr));

    auto matInstance = mat->createInstance();
    if(argumentCount > 2) {
        string file = JSValueToStdString(ctx, arguments[2]);
        matInstance->setParameter("texture", loadImage(file), TextureSampler());
    }

    RenderableManager::Builder(1)
        .boundingBox({{ -1, -1, -1 }, { 1, 1, 1 }})
        .material(0, matInstance)
        .geometry(0, RenderableManager::PrimitiveType::TRIANGLES, vb, ib, 0, 6)
        .culling(false)
        .receiveShadows(false)
        .castShadows(false)
        .build(*engine, entity);
    
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
        
        filament::math::float3 pos {d[i + 1], d[i + 2], d[i + 3] };
        filament::math::float3 rot {d[i + 4], d[i + 5], d[i + 6] };
        filament::math::float3 scl {d[i + 7], d[i + 8], d[i + 9] };

        Entity e = Entity::import(id);
        
        tcm.setTransform(tcm.getInstance(e),
            filament::math::mat4f::translation(pos) *
            filament::math::mat4f::eulerZYX(rot.z, rot.y, rot.x) *
            filament::math::mat4f::scaling(scl));
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
    const double far    =  1.0;
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

void GameEngine::input(uint32_t x, uint32_t y, int32_t state) {
    JSObjectRef globalObject = JSContextGetGlobalObject(globalContext);
    cout<< state << endl;
    
    JSStringRef inputStr = JSStringCreateWithUTF8CString("input");
    static const JSStringRef xStr = JSStringCreateWithUTF8CString("x");
    static const JSStringRef yStr = JSStringCreateWithUTF8CString("y");
    static const JSStringRef stateStr = JSStringCreateWithUTF8CString("state");
    static const JSObjectRef input = JSValueToObject(globalContext, JSObjectGetProperty(globalContext, globalObject, inputStr, nullptr), nullptr);
    
    JSObjectSetProperty(globalContext, input, xStr, JSValueMakeNumber(globalContext, x), kJSPropertyAttributeNone, nullptr);
    JSObjectSetProperty(globalContext, input, yStr, JSValueMakeNumber(globalContext, y), kJSPropertyAttributeNone, nullptr);
    JSObjectSetProperty(globalContext, input, stateStr, JSValueMakeNumber(globalContext, state), kJSPropertyAttributeNone, nullptr);
}

GameEngine::GameEngine(void* nativeWindow){
    engine = Engine::create(filament::Engine::Backend::METAL);
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
    
    const Path parent = Path::getCurrentExecutable().getParent();
//    cout << (parent + filename) << endl;
    ifstream file(parent + "bundle.js");
    ostringstream buffer;
    buffer << file.rdbuf();
    
    JSStringRef script = JSStringCreateWithUTF8CString(buffer.str().c_str());
//    JSStringRef script = JSStringCreateWithUTF8CString(source);
    JSValueRef exception = nullptr;
    JSEvaluateScript(globalContext, script, nullptr, nullptr, 0, &exception);
    if(exception) cout << JSValueToStdString(globalContext, exception);
    
    updateLoop = getScriptFunction("update", globalObject);
    resizeView = getScriptFunction("resizeView", globalObject);

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
    
    JSValueRef args[2] {
        JSValueMakeNumber(globalContext, width),
        JSValueMakeNumber(globalContext, height)
    };
    
    JSObjectCallAsFunction(globalContext, resizeView, nullptr, 2, args, nullptr);
}
