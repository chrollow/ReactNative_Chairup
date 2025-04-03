export default {
  expo: {
    name: "ChairUp",
    slug: "chairup",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera.",
        },
      ],
      "expo-secure-store",
      "@react-native-google-signin/google-signin", // Ensure this plugin is correctly referenced
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.donnabaldoza.chairup",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES, // Ensure this environment variable is set
      package: "com.donnabaldoza.chairup",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    scheme: "chairup",
    facebookScheme: "fb1196596965367294",
    owner: "donn_baldoza",
    extra: {
      googleClientId:
        "562957089179-v0glkbdo2sc169prvf84hhrdi0p2rouj.apps.googleusercontent.com",
      facebookAppId: "1196596965367294",
      eas: {
        projectId: "7a47c849-db2e-4dba-af08-01a6f8497072",
      },
    },
  },
};
