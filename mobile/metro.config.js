const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

// The pattern engine lives in the website's src/ and is shared with it, not copied.
const engine = path.resolve(__dirname, '../src')

const config = getDefaultConfig(__dirname)
config.watchFolders = [engine]
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // `~/` is the site's alias for its src/ folder, used by the engine's own imports.
  if (moduleName.startsWith('~/'))
    return context.resolveRequest(context, path.join(engine, moduleName.slice(2)), platform)
  // The engine's packages (tinycolor2) come from the app's node_modules, not the site's.
  if (context.originModulePath.startsWith(engine) && !moduleName.startsWith('.'))
    return context.resolveRequest({ ...context, originModulePath: path.join(__dirname, 'package.json') }, moduleName, platform)
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
