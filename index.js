const core = require('@actions/core')
const exec = require('@actions/exec')
const cache = require('@actions/cache')
const process = require('process')
const path = require('path')

async function doAction(paths, key, action) {
    const restoreKey = await cache.restoreCache(paths, key, [key]);
    if (restoreKey !== undefined) {
        return false
    }
    await action()
    try {
        await cache.saveCache(paths, key);
    } catch (error) {
    }
    return true
}

async function run() {
    try {
        await exec.exec('git', ['clone', '--recurse-submodules', '-j8', '--depth', '1', 'https://github.com/actboy168/luamake'], { encoding: 'utf8' })
        const luamakeDir = path.resolve('./luamake')
        const hash = (await getExecOutput('git', ['rev-parse', 'HEAD'])).stdout.trim();
        if (process.platform === 'win32') {
            const paths = [
                './luamake/luamake.exe',
                './luamake/tools/lua54.dll'
            ]
            const key = 'win32-'+hash
            await doAction(paths, key, async function() {
                await exec.exec('cmd.exe', ['/q', '/c', '.\\compile\\build.bat', 'notest'], { cwd: luamakeDir })
            })
        }
        else if (process.platform === 'darwin') {
            await exec.exec('brew', ['install', 'ninja'])
            const paths = [
                './luamake/luamake'
            ]
            const key = 'darwin-'+hash
            await doAction(paths, key, async function() {
                await exec.exec('chmod', ['+x', 'compile/build.sh'], { cwd: luamakeDir })
                await exec.exec('compile/build.sh', ["notest"], { cwd: luamakeDir })
            })
        }
        else if (process.platform === 'linux') {
            await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/gcc', 'gcc', '/usr/bin/gcc-9', '100'])
            await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/g++', 'g++', '/usr/bin/g++-9', '100'])
            const paths = [
                './luamake/luamake'
            ]
            const key = 'linux-'+hash
            if (await doAction(paths, key, async function() {
                await exec.exec('sudo', ['apt-get', 'update'])
                await exec.exec('sudo', ['apt-get', 'install', '-y', 'libreadline-dev', 'ninja-build'])
                await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/gcc', 'gcc', '/usr/bin/gcc-9', '100'])
                await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/g++', 'g++', '/usr/bin/g++-9', '100'])
                await exec.exec('chmod', ['+x', 'compile/build.sh'], { cwd: luamakeDir })
                await exec.exec('compile/build.sh', ["notest"], { cwd: luamakeDir })
            })) {
                await exec.exec('sudo', ['apt-get', 'update'])
                await exec.exec('sudo', ['apt-get', 'install', '-y', 'ninja-build'])
                await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/gcc', 'gcc', '/usr/bin/gcc-9', '100'])
                await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/g++', 'g++', '/usr/bin/g++-9', '100'])
            }
        }
        else {
            throw new Error(`Unsupported platform '${process.platform}'`)
        }
        core.debug(`Added to PATH: ${luamakeDir}`)
        core.addPath(luamakeDir)
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
