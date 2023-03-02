const core = require('@actions/core')
const exec = require('@actions/exec')
const process = require('process')
const path = require('path')

async function run() {
    try {
        const workdir = process.env['RUNNER_TOOL_CACHE']
        await exec.exec('git', ['clone', '--recurse-submodules', '-j8', '--depth', '1', 'https://github.com/actboy168/luamake'], { cwd: workdir, encoding: 'utf8' })
        const luamakedir = path.join(workdir, 'luamake')
        if (process.platform === 'win32') {
            await exec.exec('cmd.exe', ['/q', '/c', '.\\compile\\build.bat', 'notest'], { cwd: luamakedir })
        }
        else if (process.platform === 'darwin') {
            await exec.exec('brew', ['install', 'ninja'])
            await exec.exec('chmod', ['+x', 'compile/build.sh'], { cwd: luamakedir })
            await exec.exec('compile/build.sh', ["notest"], { cwd: luamakedir })
        }
        else if (process.platform === 'linux') {
            await exec.exec('sudo', ['apt-get', 'update'])
            await exec.exec('sudo', ['apt-get', 'install', '-y', 'libreadline-dev', 'ninja-build'])
            await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/gcc', 'gcc', '/usr/bin/gcc-9', '100'])
            await exec.exec('sudo', ['update-alternatives', '--install', '/usr/bin/g++', 'g++', '/usr/bin/g++-9', '100'])
            await exec.exec('chmod', ['+x', 'compile/build.sh'], { cwd: luamakedir })
            await exec.exec('compile/build.sh', ["notest"], { cwd: luamakedir })
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
