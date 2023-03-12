//
//  Object_C_Interface.h
//  HelloCocoaPods
//
//  Created by Nguyen Cong Thien on 11/03/2023.
//  Copyright © 2023 Google. All rights reserved.
//

#ifndef Object_C_Interface_h
#define Object_C_Interface_h

// This is the C "trampoline" function that will be used
// to invoke a specific Objective-C method FROM C++
bool playNativeAudio(void *object, const char *parameter);

#endif /* Object_C_Interface_h */
