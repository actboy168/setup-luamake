const core = require('@actions/core')
const exec = require('@actions/exec')
const process = require('process')
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

async function run() {
    try {
        await exec.exec('git', ['clone', '--recurse-submodules', '-j8', '--depth', '1', 'https://github.com/actboy168/luamake'], { encoding: 'utf8' })

        const platform = getPlatform()
        const luamakeDir = path.resolve(process.cwd(), 'luamake')
        if (platform === 'msvc') {
            core.addPath(luamakeDir + "\\tools")
        }
        else if (platform === 'macos') {
            await exec.exec('brew', ['install', 'ninja'], { encoding: 'utf8' })
        }
        else if (platform === 'linux') {
            await exec.exec('sudo', ['apt-get', 'install', '-y', 'ninja-build'], { encoding: 'utf8' })
        }

        await exec.exec('ninja', ['-f', 'ninja/' + platform + '.ninja'], { encoding: 'utf8', cwd: luamakeDir })
        core.addPath(luamakeDir)
    } catch (error) {
        core.setFailed(error.message)
    }
}
run()
