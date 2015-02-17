`keytool -genkey -v -keystore qrvin-release-key.keystore -alias qrvin_alias_name -keyalg RSA -keysize 2048 -validity 10000`

After the keystore is created (in the directory you made the command in) update platforms/android/ant.properties with the path to the keystore and the alias name.