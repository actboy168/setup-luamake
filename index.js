const core = require('@actions/core')
const exec = require('@actions/exec')
const cache = require('@actions/cache')
const process = require('process')
const path = require('path')

async function doAction(paths, key, action) {
    const restoreKey = await cache.restoreCache(paths, key, []);
    if (restoreKey !== undefined) {
        console.debug(`Cache ${key} restore.`);
        return false
    }
    await action()
    try {
        await cache.saveCache(paths, key);
        console.debug(`Cache ${key} saved.`);
    } catch (error) {
        console.debug(error.message);
    }
    return true
}

async function run() {
    try {
        const workdir = process.env['RUNNER_WORKSPACE']
        await exec.exec('git', ['clone', '--recurse-submodules', '-j8', '--depth', '1', 'https://github.com/actboy168/luamake'], { cwd: workdir, encoding: 'utf8' })
        const luamakedir = path.join(workdir, 'luamake')
        const hash = (await exec.getExecOutput('git', ['rev-parse', 'HEAD'], { cwd: luamakedir })).stdout.trim();
        if (process.platform === 'win32') {
            const paths = [
                path.join(luamakedir, 'luamake.exe'),
                path.join(luamakedir, 'tools', 'lua54.dll')
            ]
            const key = [ "windows", hash ].join("-")
            await doAction(paths, key, async function() {
                await exec.exec('cmd.exe', ['/q', '/c', '.\\compile\\build.bat', 'notest'], { cwd: luamakedir })
            })
        }
        else if (process.platform === 'darwin') {
            await exec.exec('brew', ['install', 'ninja'])
            const paths = [
                path.join(luamakedir, 'luamake')
            ]
            const key = [ "macos", hash ].join("-")
            await doAction(paths, key, async function() {
                await exec.exec('chmod', ['+x', 'compile/build.sh'], { cwd: luamakedir })
                await exec.exec('compile/build.sh', ["notest"], { cwd: luamakedir })
            })
        }
        else if (process.platform === 'linux') {
            await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/gcc', 'gcc', '/usr/bin/gcc-9', '100'])
            await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/g++', 'g++', '/usr/bin/g++-9', '100'])
            const paths = [
                path.join(luamakedir, 'luamake')
            ]
            const version = (await exec.getExecOutput('lsb_release', ['-r', '-s'])).stdout.trim();
            const key = [ "ubuntu", version, hash ].join("-")
            if (await doAction(paths, key, async function() {
                await exec.exec('sudo', ['apt-get', 'update'])
                await exec.exec('sudo', ['apt-get', 'install', '-y', 'libreadline-dev', 'ninja-build'])
                await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/gcc', 'gcc', '/usr/bin/gcc-9', '100'])
                await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/g++', 'g++', '/usr/bin/g++-9', '100'])
                await exec.exec('chmod', ['+x', 'compile/build.sh'], { cwd: luamakedir })
                await exec.exec('compile/build.sh', ["notest"], { cwd: luamakedir })
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
        core.debug(`Added to PATH: ${luamakedir}`)
        core.addPath(luamakedir)
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
