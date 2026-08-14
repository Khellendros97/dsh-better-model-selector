// dsh-better-model-selector — host half.
//
// Pure client (browser) plugin: the host half has no behavior. It exists so
// the package appears as a host cordis entry; the browser half ships via
// exports["./client"] and is discovered through the package.json `dsh.client`
// declaration (platform: web).
export const name = 'dsh-better-model-selector'
export const inject = []
export function apply() {}
