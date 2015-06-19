Update www/config.xml with new version number and package "com.qrvin"

`cd /Volumes/HD/Users/nicolebeguesse/Documents/uploads`

`sudo chmod -R 777 platforms/ios` if necessary

`sudo cordova build ios`

Open platforms/ios/MonroneyLabels.xcodeproj

Select Target > General and change package name to com.qrvin. Change version number if necessary.

Product > Archive

Select the archive (in organizer window) and choose "Validate..." then "Submit to App Store..."

Builds appear in App Store after a couple of minutes. Log in to iTunes Connect and publish the build.

To make screenshots, open Firebug and do

`window.open(top.location.href, "", "width=1136, height=600");`