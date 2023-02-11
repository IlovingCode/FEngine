./matc -p mobile -a opengl -f header -o "../android/app/src/main/cpp/bakedColor.inc" "./bakedColor.mat"
./matc -p mobile -a opengl -f header -o "../android/app/src/main/cpp/bakedText.inc" "./bakedText.mat"
./matc -p mobile -a opengl -f header -o "../android/app/src/main/cpp/bakedMask.inc" "./bakedMask.mat"

./matc -p mobile -a metal -f header -o "../ios/HelloCocoaPods/bakedColor.inc" "./bakedColor.mat"
./matc -p mobile -a metal -f header -o "../ios/HelloCocoaPods/bakedText.inc" "./bakedText.mat"
./matc -p mobile -a metal -f header -o "../ios/HelloCocoaPods/bakedMask.inc" "./bakedMask.mat"

./mipgen -f ktx2 --compression=uastc -m 1 tiny.png            "../android/app/src/main/assets/tiny.ktx2"
./mipgen -f ktx2 --compression=uastc -m 1 red.png             "../android/app/src/main/assets/red.ktx2"

./mipgen -f ktx2 --compression=uastc -m 1 progress_fill.png   "../android/app/src/main/assets/progress_fill.ktx2"
./mipgen -f ktx2 --compression=uastc -m 1 progress_bg.png     "../android/app/src/main/assets/progress_bg.ktx2"