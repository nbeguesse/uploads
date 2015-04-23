## Phonegap/Cordova 3.5.0 ##

Warning: If you reinstall phonegap/cordova, you will need to update the whole app to match.

There are a couple options to run it:
	1. Drag www/index.html to a browser window
	2. `ripple emulate` - open the URL in chrome to emulate. Everything but firing events works.
	3. `cordova run android` - will install on phone if phone is plugged in. Otherwise will launch Android Emulator (slow!!)

To run on iOS:
	1. `cordova build ios`
	2. open platforms/ios/QRVin.xcodeproj
	3. Then choose the device and hit the play button.

Hybrid App Features:
	- Daily sync with server.
	- Sign up new user in-app
	- In-app Purchases if car is not available
	- View window sticker and print window sticker
	- Changes views based on phone/tablet size
	- (Uploading images was commented out)

