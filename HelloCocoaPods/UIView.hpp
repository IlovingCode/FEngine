//
//  UIView.hpp
//  HelloCocoaPods
//
//  Created by Nguyen Cong Thien on 14/06/2022.
//  Copyright © 2022 Google. All rights reserved.
//

#include <utils/Entity.h>
#include <iostream>
#include <stdint.h>

using namespace utils;
using namespace std;

#ifndef UIView_hpp
#define UIView_hpp

class UIVIew {
public:
    UIVIew(size_t designWidth, size_t designHeight);
    void addSprite(size_t width, size_t height, string spriteName, Entity entity);
};

#endif /* UIView_hpp */
