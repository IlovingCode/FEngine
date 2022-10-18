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
    void resize(uint16_t width, uint16_t height);
    void input(int16_t x, int16_t y, int16_t state);
    ~GameEngine();
};

#endif /* GameEngine_hpp */
