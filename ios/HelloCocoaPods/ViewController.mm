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
#import <AVFAudio/AVFAudio.h>
#import <WebKit/WebKit.h>

#import "GameEngine.hpp"

@interface ViewController () <MTKViewDelegate, WKScriptMessageHandler, WKUIDelegate>

@end

@implementation ViewController {
    GameEngine* _gameEngine;
    NSArray<AVAudioPlayer*>* _audioPlayers;
    NSMutableDictionary<NSString*, NSData*>* _audioTrack;
    
    WKWebView* _webview;
}

// C "trampoline" function to invoke Objective-C method
bool playNativeAudio(void *self, const char* parameter)
{
    // Call the Objective-C method using Objective-C syntax
    return [(__bridge id)self playAudio:[NSString stringWithUTF8String:parameter]];
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
    
    _gameEngine = new GameEngine((__bridge void*) mtkView.layer, CACurrentMediaTime());
    _gameEngine->setNativeHandle((__bridge void*) self);
    // Give our View a starting size based on the drawable size.
    [self mtkView:mtkView drawableSizeWillChange:mtkView.drawableSize];
    
    _audioPlayers = @[
        [AVAudioPlayer alloc],
        [AVAudioPlayer alloc],
        [AVAudioPlayer alloc],
        [AVAudioPlayer alloc],
        [AVAudioPlayer alloc],
    ];
    
    NSData* empty = [NSData alloc];
    for(AVAudioPlayer* player in _audioPlayers) {
        [[player initWithData:empty error:NULL] stop];
    }
    
    _audioTrack = [[NSMutableDictionary<NSString*, NSData*> alloc] init];
    
    _webview = [[WKWebView alloc] initWithFrame:mtkView.frame];
    [mtkView addSubview:_webview];
    _webview.opaque = false;
    _webview.UIDelegate = self;
    _webview.backgroundColor = UIColor.clearColor;
    _webview.scrollView.showsVerticalScrollIndicator = false;

    WKUserContentController *controller = _webview.configuration.userContentController;
    [controller addScriptMessageHandler:self name:@"sendInput"];

    NSString* path = [[NSBundle mainBundle] pathForResource:@"assets/index" ofType:@"html"];
    NSString *str = [NSString stringWithContentsOfFile:path encoding:NSUTF8StringEncoding error:nil];
    [_webview loadHTMLString:str baseURL:nil];
}

- (void)dealloc {
    delete _gameEngine;
}

- (BOOL) playAudio:(NSString*)path{
    NSData* data = _audioTrack[path];
    if(!data) {
        NSArray* components = [path componentsSeparatedByString:@"."];
        NSURL* url = [[NSBundle mainBundle] URLForResource:components[0] withExtension:components[1]];
        data = [[NSData alloc] initWithContentsOfURL:url];
        _audioTrack[path] = data;
    }
    
    for(AVAudioPlayer* player in _audioPlayers)
    {
       // do stuff with object
        if(!player.isPlaying) return [[player initWithData:data error:NULL] play];
    }
    
    return false;
}

- (void)mtkView:(nonnull MTKView*)view drawableSizeWillChange:(CGSize)size {
    _gameEngine->resize(size.width, size.height);
    [_webview setFrame:view.frame];
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

- (void)userContentController:(WKUserContentController *)userContentController
                            didReceiveScriptMessage:(WKScriptMessage *)message{
    if([message.name isEqualToString:@"sendInput"]) {
        const long x = [[message.body valueForKey:@"x"] integerValue];
        const long y = [[message.body valueForKey:@"y"] integerValue];
        uint8_t state = [[message.body valueForKey:@"state"] integerValue];
        
        float scale = self.view.contentScaleFactor;
        NSLog(@"%hhu", state);
        _gameEngine->input(x * scale, y * scale, state);
    }
}

- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(void))completionHandler
{
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:message
                                                                             message:nil
                                                                      preferredStyle:UIAlertControllerStyleAlert];
    [alertController addAction:[UIAlertAction actionWithTitle:@"OK"
                                                        style:UIAlertActionStyleCancel
                                                      handler:^(UIAlertAction *action) {
                                                          completionHandler();
                                                      }]];
    [self presentViewController:alertController animated:YES completion:^{}];
}

@end
