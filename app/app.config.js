const base = require('./app.json').expo;

const fbId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
const googleIos = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

const extraSchemes = [];
if (googleIos?.includes('.apps.googleusercontent.com')) {
  const reversed = googleIos.split('.').reverse().join('.');
  extraSchemes.push(reversed);
}
if (fbId) {
  extraSchemes.push(`fb${fbId}`);
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...base,
    scheme: extraSchemes.length ? [base.scheme, ...extraSchemes] : base.scheme,
    ios: {
      ...base.ios,
      usesAppleSignIn: true,
    },
    plugins: [...(base.plugins ?? []), 'expo-apple-authentication'],
    ...(fbId
      ? {
          facebookAppId: fbId,
          facebookScheme: `fb${fbId}`,
          facebookDisplayName: base.name,
        }
      : {}),
  },
};
