const core = require('@actions/core')
const process = require('process')
const child_process = require('child_process')
const path = require('path')

const selectPlatforn = (platform) =>
    platform ? [null, platform] :
        process.platform === 'win32' ? [null, 'msvc'] :
            process.platform === 'darwin' ? [null, 'macos'] :
                process.platform === 'linux' ? [null, 'linux'] :
                    [new Error(`Unsupported platform '${process.platform}'`), '']

try {
    const [error, platform] = selectPlatforn(core.getInput('platform'));
    if (error) throw error

    const cloneLuamake = 'git clone --recurse-submodules -j8 --depth 1 https://github.com/actboy168/luamake'
    const cloneResult = child_process.spawnSync(cloneLuamake, { encoding: 'utf8' })
    if (cloneResult.error) throw error
    console.log('$ ' + cloneLuamake)
    console.log(cloneResult.stdout)

    const compileLuamake = 'ninja -f ninja/'+platform+'.ninja'
    const compileResult = child_process.spawnSync(compileLuamake, { encoding: 'utf8' })
    if (cloneResult.error) throw error
    console.log('$ ' + compileLuamake)
    console.log(cloneResult.stdout)

    core.addPath(path.resolve(process.cwd(), 'luamake'))
} catch (error) {
    core.setFailed(error.message)
}
