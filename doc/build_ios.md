`cordova build ios`

Select Target > General and change package name to com.qrvin. Change version number if necessary.

Product > Archive

Select the archive (in organizer window) and choose "Validate..." then "Submit..."

To make screenshots, open Firebug and do

`window.open(top.location.href, "", "width=1136, height=600");`