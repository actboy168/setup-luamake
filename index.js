const core = require('@actions/core')
const exec = require('@actions/exec')
const process = require('process')
const child_process = require('child_process')
const path = require('path')

function getPlatform() {
    if (process.platform === 'win32') {
        return 'msvc'
    }
    if (process.platform === 'darwin') {
        return 'macos'
    }
    if (process.platform === 'linux') {
        return 'linux'
    }
    throw new Error(`Unsupported platform '${process.platform}'`)
}

function runs(command, args, options) {
    console.log('$ ' + command + ' ' + args.join(" "))
    const result = child_process.spawnSync(command, args, options)
    if (result.error) {
        throw result.error
    }
    if (result.status !== 0) {
        throw result.stderr
    }
    console.log(result.stdout)
}

async function run() {
    try {
        const platform = getPlatform()
        const luamakeDir = path.resolve(process.cwd(), 'luamake')
        await exec.exec('git', ['clone', '--recurse-submodules', '-j8', '--depth', '1', 'https://github.com/actboy168/luamake'], { encoding: 'utf8' })
        await exec.exec('ninja', ['-f', 'ninja/' + platform + '.ninja'], { encoding: 'utf8', cwd: luamakeDir })
        core.addPath(luamakeDir)
    } catch (error) {
        core.setFailed(error.message)
    }
}
run()
