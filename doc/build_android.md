Increase version number in www/config.xml, platforms/android/AndroidManifest.xml

From the root directory:

`cordova build android`

`cd platforms/android`

`ant release`

(enter password 2x)

`cd bin`

`rm QRVin.apk`

`jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../qrvin-release-key.keystore QRVin-release-unsigned.apk qrvin_alias_name`

(enter password)

`jarsigner -verify -verbose -certs QRVin-release-unsigned.apk`

`zipalign -v 4 QRVin-release-unsigned.apk QRVin.apk`