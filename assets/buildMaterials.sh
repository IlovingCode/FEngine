# ./matc -p mobile -a opengl -f header -o "../android/app/src/main/cpp/bakedColor.inc" "./bakedColor.mat"
# ./matc -p mobile -a opengl -f header -o "../android/app/src/main/cpp/bakedText.inc" "./bakedText.mat"
# ./matc -p mobile -a opengl -f header -o "../android/app/src/main/cpp/bakedMask.inc" "./bakedMask.mat"

# ./matc -p mobile -a metal -f header -o "../android/app/src/main/cpp/bakedColor_ios.inc" "./bakedColor.mat"
# ./matc -p mobile -a metal -f header -o "../android/app/src/main/cpp/bakedText_ios.inc" "./bakedText.mat"
# ./matc -p mobile -a metal -f header -o "../android/app/src/main/cpp/bakedMask_ios.inc" "./bakedMask.mat"

# ./mipgen -f ktx2 --compression=uastc -m 1 tiny.png            "../android/app/src/main/assets/tiny.ktx2"
# ./mipgen -f ktx2 --compression=uastc -m 1 red.png             "../android/app/src/main/assets/red.ktx2"

# ./mipgen -f ktx2 --compression=uastc -m 1 progress_fill.png   "../android/app/src/main/assets/progress_fill.ktx2"
# ./mipgen -f ktx2 --compression=uastc -m 1 progress_bg.png     "../android/app/src/main/assets/progress_bg.ktx2"

./mipgen -f ktx2 --compression=uastc -m 1 bg0.png   "../android/app/src/main/assets/bg0.ktx2"
./mipgen -f ktx2 --compression=uastc -m 1 bg1.png   "../android/app/src/main/assets/bg1.ktx2"
./mipgen -f ktx2 --compression=uastc -m 1 bg2.png   "../android/app/src/main/assets/bg2.ktx2"
./mipgen -f ktx2 --compression=uastc -m 1 bg3.png   "../android/app/src/main/assets/bg3.ktx2"