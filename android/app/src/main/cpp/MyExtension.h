#ifndef MyTextureLoader_hpp
#define MyTextureLoader_hpp

#include <spine/spine.h>
#include <filament/Texture.h>
#include <iostream>

using namespace std;

typedef filament::Texture* (*LoadTexture)(const char*);
typedef void (*UnloadTexture)(filament::Texture*);
typedef const uint8_t* (*Loadfile)(const char*, size_t*);

namespace spine {
	class MyTextureLoader : public TextureLoader {
    private:
        LoadTexture loadFunc;
        UnloadTexture unloadFunc;
	public:
        MyTextureLoader(LoadTexture _loadfunc, UnloadTexture _unloadfunc) : TextureLoader() {
            loadFunc = _loadfunc;
            unloadFunc = _unloadfunc;
        };

        ~MyTextureLoader() {};

        void load(AtlasPage &page, const String &path){
            filament::Texture *texture = loadFunc(path.buffer());
            page.texture = texture;
            page.width = (int)texture->getWidth();
            page.height = (int)texture->getHeight();
        }

        void unload(void *texture){
            unloadFunc((filament::Texture*)texture);
        }
	};

	class MyExtension : public DefaultSpineExtension {
    private:
        Loadfile loadFunc;
	public:
        MyExtension(Loadfile _loadfunc) : DefaultSpineExtension() {
            loadFunc = _loadfunc;
        };

        virtual ~MyExtension() {};

	protected:
        char *_readFile(const String &path, int *length) {
            return (char*)loadFunc(path.buffer(), (size_t*)length);
        }
	};
}// namespace spine

#endif
