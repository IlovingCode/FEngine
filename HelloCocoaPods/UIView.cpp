//
//  UIView.cpp
//  HelloCocoaPods
//
//  Created by Nguyen Cong Thien on 14/06/2022.
//  Copyright © 2022 Google. All rights reserved.
//

#include "UIView.hpp"


size_t width;
size_t height;

UIVIew::UIVIew (size_t designWidth, size_t designHeight) {
    width = designWidth;
    height = designHeight;
}

void UIVIew::addSprite(size_t width, size_t height, string spriteName) {
    float VERTICES[16] = {
        -1, -1, 0, 0,
         1, -1, 1, 0,
        -1,  1, 0, 1,
         1,  1, 1, 1,
    };
}
