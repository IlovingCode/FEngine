//
//  GameEngine.hpp
//  hello-triangle
//
//  Created by Nguyen Cong Thien on 25/04/2022.
//

#ifndef GameEngine_hpp
#define GameEngine_hpp

#include <stdint.h>
#ifdef ANDROID
#include <android/log.h>
#define  LOGI(...)  __android_log_print(ANDROID_LOG_INFO, "Filament", __VA_ARGS__)
#else
#define  LOGI(...)  printf(__VA_ARGS__)
#endif

class GameEngine {
public:
    GameEngine(void* nativeWindow, double now);
    void setNativeHandle(void* handle);
    void update(double now);
    void resize(uint16_t width, uint16_t height);
    void input(float x, float y, uint8_t state);
    ~GameEngine();
};

#endif /* GameEngine_hpp */
