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

        virtual ~MyTextureLoader() {};

        virtual void load(AtlasPage &page, const String &path){
            filament::Texture *texture = loadFunc(path.buffer());
            page.texture = texture;
            page.width = (int)texture->getWidth();
            page.height = (int)texture->getHeight();
        }

        virtual void unload(void *texture){
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
        virtual char *_readFile(const String &path, int *length) {
            return (char*)loadFunc(path.buffer(), (size_t*)length);
        }
        
//        virtual void *_alloc(size_t size, const char *file, int line) {
//            SP_UNUSED(file);
//            SP_UNUSED(line);
//
//            if (size == 0)
//                return 0;
//            void *ptr = new char[size];
//            return ptr;
//        }
//
//        virtual void *_calloc(size_t size, const char *file, int line) {
//            SP_UNUSED(file);
//            SP_UNUSED(line);
//
//            if (size == 0)
//                return 0;
//
//            void *ptr = new char[size];
//            if (ptr) {
//                memset(ptr, 0, size);
//            }
//            return ptr;
//        }
        
//        virtual void _free(void *mem, const char *file, int line) {
//            SP_UNUSED(file);
//            SP_UNUSED(line);
//
//            delete [] (char*)mem;
//        }
        
//        virtual void *_realloc(void *ptr, size_t size, const char *file, int line) {
//            SP_UNUSED(file);
//            SP_UNUSED(line);
//
//            void *mem = NULL;
//            if (size == 0)
//                return 0;
//            if (ptr == NULL)
//                mem = new char[size];
//            else
//                mem = ::realloc(ptr, size);
//            return mem;
//        }
	};
}// namespace spine

#endif
