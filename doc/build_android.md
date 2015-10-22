Increase version number in top-level config.xml (app package is com.hls.qrvin)

From the root directory:

`cordova build android`

`cd platforms/android`

`ant release`

(enter password 2x)

`cd bin`

`rm MonroneyLabels.apk`

`jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../qrvin-release-key.keystore MonroneyLabels-release-unsigned.apk qrvin_alias_name`

(enter password)

`jarsigner -verify -verbose -certs MonroneyLabels-release-unsigned.apk`

`zipalign -v 4 MonroneyLabels-release-unsigned.apk MonroneyLabels.apk`