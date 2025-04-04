import 'dotenv/config';

export default {
  "expo": {
    "name": "ChairUp",
    "slug": "chairup",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.donnabaldoza.chairup"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO"
      ],
      "package": "com.donnabaldoza.chairup",
      "googleServicesFile": process.env.GOOGLE_SERVICES_LOGIN
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera."
        }
      ],
      "expo-secure-store",
      "@react-native-google-signin/google-signin"
    ],
    "scheme": "chairup",
    "facebookScheme": "fb1196596965367294",
    "owner": "donn_baldoza",
    "extra": {
      "googleClientId": "342445904600-4diarlo8slhta1kjb6cj6s3eqb2r9cjf.apps.googleusercontent.com",
      "facebookAppId": "1196596965367294",
      "eas": {
        "projectId": "7a47c849-db2e-4dba-af08-01a6f8497072"
      }
    }
  }
}
