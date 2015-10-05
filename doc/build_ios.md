Update www/config.xml with new version number and package "com.qrvin"

`cd /Volumes/HD/Users/nicolebeguesse/Documents/uploads`

`sudo chmod -R 777 platforms/ios` if necessary

`sudo cordova build ios`

Open platforms/ios/MonroneyLabels.xcodeproj

Select Product > Archive

Select the archive (in organizer window) and choose "Validate..." then "Submit to App Store...". Should be 6 entitlements.

Builds appear in App Store after a couple of minutes. Log in to iTunes Connect, go to "My Apps" and click "New Store Version". Enter in the new version number. Scroll down to builds and submit the build you uploaded. Then save and submit for review.
