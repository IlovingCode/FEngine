# ./matc -p mobile -a opengl -f header -o "./bakedColor.inc" "./bakedColor.mat"
./matc -p mobile -a metal -f header -o "../HelloCocoaPods/bakedColor.inc" "./bakedColor.mat"
./matc -p mobile -a metal -f header -o "../HelloCocoaPods/bakedText.inc" "./bakedText.mat"
./matc -p mobile -a metal -f header -o "../HelloCocoaPods/bakedMask.inc" "./bakedMask.mat"

# ./mipgen -f ktx2 --compression=uastc -m 1 tiny.png "../HelloCocoaPods/tiny.ktx2"
# ./mipgen -f ktx2 --compression=uastc -m 1 red.png "../HelloCocoaPods/red.ktx2"

# ./mipgen -f ktx2 --compression=uastc -m 1 progress_fill.png "../HelloCocoaPods/progress_fill.ktx2"
# ./mipgen -f ktx2 --compression=uastc -m 1 progress_bg.png "../HelloCocoaPods/progress_bg.ktx2"