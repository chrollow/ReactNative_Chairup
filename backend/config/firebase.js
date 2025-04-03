const admin = require('firebase-admin');
const serviceAccount = require('C:\Users\Jade\OneDrive\Desktop\eas build\ReactNative_Chairup\google-services.json'); // Replace with your Firebase service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;