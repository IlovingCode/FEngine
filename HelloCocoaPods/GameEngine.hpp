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
    GameEngine(void* nativeWindow);
    void update(double now);
    void resize(uint32_t width, uint32_t height);
    void input(uint32_t x, uint32_t y, int32_t state);
    ~GameEngine();
};

#endif /* GameEngine_hpp */
