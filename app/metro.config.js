const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const includePreview = process.env.EXPO_PUBLIC_INCLUDE_PREVIEW === 'true';

if (!includePreview) {
  config.resolver.blockList = [
    ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
    /[/\\]app[/\\]preview[/\\].*/,
  ];
}

module.exports = config;
