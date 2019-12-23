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

function runs(command, args) {
    const result = child_process.spawnSync(command, args, { encoding: 'utf8' })
    if (result.error) throw result.error
    console.log('$ '+command+' '+args.join(" "))
    console.log(result.stdout)
}

try {
    const [error, platform] = selectPlatforn(core.getInput('platform'));
    if (error) throw error
    runs('git', ['clone', '--recurse-submodules', '-j8', '--depth', '1', 'https://github.com/actboy168/luamake'])
    runs('ninja', ['-f', 'ninja/'+platform+'.ninja'])
    core.addPath(path.resolve(process.cwd(), 'luamake'))
} catch (error) {
    core.setFailed(error.message)
}
