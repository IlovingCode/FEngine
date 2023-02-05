/*
* Copyright 2020 The Android Open Source Project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

#import "ViewController.h"

#import <MetalKit/MTKView.h>

#import "GameEngine.hpp"

@interface ViewController () <MTKViewDelegate>

@end

@implementation ViewController {
    GameEngine* _gameEngine;
}

- (void)viewDidLoad {
    [super viewDidLoad];

    // Create an Engine, the main entry point into Filament.

    // Create a SwapChain from a CAMetalLayer.
    // This ViewController's view is a MTKView, which is backed by a CAMetalLayer.
    // We must use __bridge here; Filament does not take ownership of the layer.
    MTKView* mtkView = (MTKView*) self.view;
    mtkView.delegate = self;
    
//    NSString* path = [[NSBundle mainBundle] pathForResource:@"bundle" ofType:@"js"];
//    NSString* content = [NSString stringWithContentsOfFile:path encoding:NSUTF8StringEncoding error:NULL];
    
    _gameEngine = new GameEngine((__bridge void*) mtkView.layer);
    // Give our View a starting size based on the drawable size.
    [self mtkView:mtkView drawableSizeWillChange:mtkView.drawableSize];
}

- (void)dealloc {
    delete _gameEngine;
}

- (void)mtkView:(nonnull MTKView*)view drawableSizeWillChange:(CGSize)size {
    _gameEngine->resize(size.width, size.height);
}

- (void)drawInMTKView:(nonnull MTKView*)view {
    _gameEngine->update(CACurrentMediaTime());
}

#pragma mark - touch event methods
- (void)touchesBegan:(NSSet<UITouch*> *)touches withEvent:(UIEvent *)event {
    [self sendInput:touches.anyObject];
}
- (void)touchesCancelled:(NSSet<UITouch*> *)touches withEvent:(UIEvent *)event {
    [self sendInput:touches.anyObject];
}
- (void)touchesEnded:(NSSet<UITouch*> *)touches withEvent:(UIEvent *)event {
    [self sendInput:touches.anyObject];
}

- (void)touchesMoved:(NSSet<UITouch*> *)touches withEvent:(UIEvent *)event {
    [self sendInput:touches.anyObject];
}


- (void)sendInput:(UITouch*)touch {
    CGPoint location = [touch locationInView:self.view];
    float scale = self.view.contentScaleFactor;
    _gameEngine->input(location.x * scale, location.y * scale, (uint8_t)touch.phase);
}

@end
