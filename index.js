const core = require('@actions/core')
const exec = require('@actions/exec')
const spawn = require('child_process').spawnSync
const process = require('process')
const path = require('path')

const InterestingVariables = [
    'INCLUDE',
    'LIB',
    'LIBPATH',
    'Path',
    'Platform',
    /^VCTools/,
    /^VSCMD_/,
    /^WindowsSDK/i,
]

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

async function spawn(command, args) {
    var stdout = "";
    const options = {};
    options.listeners = {
        stdout: (data) => stdout += data.toString()
    };
    await exec.exec(command, args, options);
    return stdout;
}

async function setupMsvc() {
    var installationPath = await spawn('"C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe"', ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationPath'])
    installationPath = installationPath.replace(/(\r|\n)/gi, "");
    const vcVarsAll = path.join(installationPath, 'VC\\Auxiliary\\Build\\vcvarsall.bat')
    const arch = core.getInput('arch');
    var environment = await spawn('cmd.exe', ['/q', '/c', vcVarsAll, arch, '&', 'set']);
    environment = environment.split('\r\n');
    for (let string of environment) {
        const [name, value] = string.split('=')
        for (let pattern of InterestingVariables) {
            if (name.match(pattern)) {
                core.exportVariable(name, value)
                break
            }
        }
    }
}

async function setupNinja(platform, luamakeDir) {
    if (platform === 'msvc') {
        await setupMsvc()
        const dir = luamakeDir + "\\tools";
        core.addPath(dir);
        console.log(`added '${dir}' to PATH`);
    }
    else if (platform === 'macos') {
        await exec.exec('brew', ['install', 'ninja'])
    }
    else if (platform === 'linux') {
        await exec.exec('sudo', ['apt-get', 'update'])
        await exec.exec('sudo', ['apt-get', 'install', '-y', 'libreadline-dev', 'ninja-build'])
    }
}

async function run() {
    try {
        await exec.exec('git', ['clone', '--recurse-submodules', '-j8', '--depth', '1', 'https://github.com/actboy168/luamake'], { encoding: 'utf8' })
        const platform = getPlatform()
        const luamakeDir = path.resolve(process.cwd(), 'luamake')
        await setupNinja(platform, luamakeDir)
        
        const result = spawn('ninja', ['--version'], {encoding: 'utf8'})
        if (result.error) throw error
        console.log(`$ ninja --version`)
        console.log(result.stdout.trim())

        await exec.exec('ninja', ['-f', 'ninja/' + platform + '.ninja'], { cwd: luamakeDir })

        core.addPath(luamakeDir)
        console.log(`added '${luamakeDir}' to PATH`);
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
