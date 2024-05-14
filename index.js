const core = require('@actions/core')
const exec = require('@actions/exec')
const process = require('process')
const path = require('path')

async function run() {
    try {
        let git_ref = core.getInput('ref')
        const workdir = process.env['RUNNER_TOOL_CACHE']
        const luamakedir = path.join(workdir, 'luamake')
        await exec.exec('git', ['clone', '-j8', '--depth', '1', '-n', 'https://github.com/actboy168/luamake'], { cwd: workdir, encoding: 'utf8' })
        await exec.exec('git', ['checkout', git_ref], { cwd: luamakedir, encoding: 'utf8' })
        await exec.exec('git', ['submodule', 'update', '--init'], { cwd: luamakedir, encoding: 'utf8' })
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
