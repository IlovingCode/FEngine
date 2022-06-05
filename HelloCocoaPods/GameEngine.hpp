//
//  GameEngine.hpp
//  hello-triangle
//
//  Created by Nguyen Cong Thien on 25/04/2022.
//

#ifndef GameEngine_hpp
#define GameEngine_hpp

#include <stdint.h>

class GameEngine {
public:
    GameEngine(void* nativeWindow, const char* source);
    void update(double now);
    void resize(uint32_t width, uint32_t height);
    ~GameEngine();
};

#endif /* GameEngine_hpp */
