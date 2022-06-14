//
//  UIView.cpp
//  HelloCocoaPods
//
//  Created by Nguyen Cong Thien on 14/06/2022.
//  Copyright © 2022 Google. All rights reserved.
//

#include "UIView.hpp"

#include <filament/VertexBuffer.h>
#include <filament/IndexBuffer.h>
#include <filament/RenderableManager.h>
#include <filament/Material.h>
#include <filament/MaterialInstance.h>
#include <filament/TextureSampler.h>

#include <ktxreader/Ktx2Reader.h>

#include <utils/Path.h>
#include <fstream>

using namespace filament;

size_t width;
size_t height;
extern Engine *engine;

UIVIew::UIVIew (size_t designWidth, size_t designHeight) {
    width = designWidth;
    height = designHeight;
}

vector<uint8_t> readFile(const Path& inputPath) {
    ifstream file(inputPath, ios::binary);
    return vector<uint8_t>((istreambuf_iterator<char>(file)), {});
}

Texture* loadImage(string filename) {
    const Path parent = Path::getCurrentExecutable().getParent();
    cout << (parent + filename) << endl;
    const auto contents = readFile(parent + filename);

    ktxreader::Ktx2Reader reader(*engine);

    // Uncom = 0essed formats are lower priority, so they get added last.
    reader.requestFormat(Texture::InternalFormat::SRGB8_A8);
    reader.requestFormat(Texture::InternalFormat::RGBA8);

    return reader.load(contents.data(), contents.size(),
            ktxreader::Ktx2Reader::TransferFunction::sRGB);
}

struct Vertex {
    math::float2 position;
    math::float2 uv;
};

void UIVIew::addSprite(size_t width, size_t height, string spriteName, Entity entity) {
    static constexpr Vertex VERTICES[4] = {
        {{-1, -1}, {0, 0}},
        {{ 1, -1}, {1, 0}},
        {{-1,  1}, {0, 1}},
        {{ 1,  1}, {1, 1}},
    };
    
    static constexpr uint16_t INDICES[6] = { 0, 1, 2, 3, 2, 1 };
    
    // This file is compiled via the matc tool. See the "Run Script" build phase.
    static constexpr uint8_t BAKED_COLOR_PACKAGE[] = {
        #include "bakedColor.inc"
    };
    
    static Material* mat = Material::Builder()
        .package((void*) BAKED_COLOR_PACKAGE, sizeof(BAKED_COLOR_PACKAGE))
        .build(*engine);
    
    VertexBuffer* vb = VertexBuffer::Builder()
        .vertexCount(4)
        .bufferCount(1)
        .attribute(VertexAttribute::POSITION, 0, VertexBuffer::AttributeType::FLOAT2, 0, 16)
        .attribute(VertexAttribute::UV0, 0, VertexBuffer::AttributeType::FLOAT2, 8, 16)
        .build(*engine);
    vb->setBufferAt(*engine, 0, VertexBuffer::BufferDescriptor(VERTICES, 64, nullptr));

    IndexBuffer* ib = IndexBuffer::Builder()
        .indexCount(6)
        .bufferType(IndexBuffer::IndexType::USHORT)
        .build(*engine);
    ib->setBuffer(*engine, IndexBuffer::BufferDescriptor(INDICES, 12, nullptr));

    auto matInstance = mat->createInstance();
    matInstance->setParameter("texture", loadImage(spriteName), TextureSampler());

    RenderableManager::Builder(1)
        .boundingBox({{ -1, -1, -1 }, { 1, 1, 1 }})
        .material(0, matInstance)
        .geometry(0, RenderableManager::PrimitiveType::TRIANGLES, vb, ib, 0, 6)
        .culling(false)
        .receiveShadows(false)
        .castShadows(false)
        .build(*engine, entity);
}
