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
    void input(float x, float y, uint8_t state);
    ~GameEngine();
};

#endif /* GameEngine_hpp */
