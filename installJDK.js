const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('request');

const installerPath = 'https://github.com/frekele/oracle-java/releases/download/8u181-b13/';
const jdkFolder = 'jdk1.8.0_181';

const CURRENT_DIR = process.cwd();
const DOWNLOAD_DIR = path.resolve(CURRENT_DIR, 'installer');

let INSTALLER_FILE; 
let deleteInstallerFile = false;
let doesInstallerExist = false;
let installerfileURL;

let platform = os.platform();
let arch = os.arch();

const JAVA_HOME = platform == 'linux' ? (process.env.WORKSPACE || process.env.INIT_CWD || CURRENT_DIR) + '/jdk' : process.env.JAVA_HOME;

function checkJDKExists() {
    return fs.existsSync(JAVA_HOME + '/bin/javac');
}

function installJDK() {
    let fileName = getInstallerFile();
    installerfileURL = installerPath + fileName;

    if (!fs.existsSync(DOWNLOAD_DIR)) {
        fs.mkdirSync(DOWNLOAD_DIR);
    }
    
    mkSubDirByPathSync(JAVA_HOME);

    INSTALLER_FILE = path.resolve(DOWNLOAD_DIR, fileName);

    fs.stat(installerfileURL, function (err, stats) {
        if (!err && stats.isFile()) {
            INSTALLER_FILE = installerfileURL;

            extractTargz();
        } else if(fs.existsSync(INSTALLER_FILE)) {
            console.log("JDK installer already exists, skipping download...")
            doesInstallerExist = true;
            extractTargz();
        } else {
            downloadJDK();
        }
    });
}

function mkSubDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    const subDirectories = targetDir.split(sep);
    subDirectories.pop();
  
    return subDirectories.reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {
            if (err.code === 'EEXIST') { // curDir already exists!
                return curDir;
            }
    
            // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
            if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }
    
            const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
            if (!caughtErr || caughtErr && targetDir === curDir) {
                throw err; // Throw if it's just the last created dir.
            }
        }
        return curDir;
    }, initDir);
}

function extractTargz() {
    const targz = require('targz');
    targz.decompress({src: INSTALLER_FILE, dest: DOWNLOAD_DIR}, function(err){
        if(err) {
            console.log(err);
            // if was corrupted file, re-download installer and try again
            if(doesInstallerExist) {
                doesInstallerExist = false;
                fs.unlink(INSTALLER_FILE, (err) => {
                    if(err) {
                        console.log(err);
                        process.exit(1);
                    }
                    downloadJDK();
                });
            } else {
                process.exit(1);
            }
        }
        else {
            console.log('Download and extraction of JDK completed successfully.');
            setTimeout(() => {
                const extractedPath = path.resolve(DOWNLOAD_DIR, jdkFolder);
                fs.rename(extractedPath, JAVA_HOME, (err)=>{
                    if(err) {
                        console.log(err);
                    } else {
                        console.log(`JDK successfully installed to ${JAVA_HOME}.`);
                        if(deleteInstallerFile) {
                            removeInstallerFile();
                        }
                    }
                });
            }, 5000); // wait 5 seconds for files to be released
        }
    });
}

function removeInstallerFile()
{
    fs.exists(INSTALLER_FILE, function(exists) 
    {
        if (exists) 
        {
            fs.unlinkSync(INSTALLER_FILE);
        }
    });
}

function downloadJDK() {
    console.log('Downloading JDK from ' + installerfileURL + '...\n');

    // Variable to save downloading progress
    let received_bytes = 0;
    let total_bytes = 0;

    let outStream = fs.createWriteStream(INSTALLER_FILE);

    request
      .get(installerfileURL)
            .on('error', function(err) {
                console.log(err);
            })
            .on('response', function(data) {
                total_bytes = parseInt(data.headers['content-length']);
            })
            .on('data', function(chunk) {
                received_bytes += chunk.length;
                //showDownloadingProgress(received_bytes, total_bytes);
            })
            .pipe(outStream);

    deleteInstallerFile = true;
    outStream.once('close', extractTargz)
        .once('error', function (err) {
            console.log(err);
        });
};

function showDownloadingProgress(received, total) {
    let percentage = ((received * 100) / total).toFixed(2);
    process.stdout.write((platform == 'win32') ? "\033[0G": "\r");
    process.stdout.write(percentage + "% | " + received + " bytes downloaded out of " + total + " bytes.");
}

function getInstallerFile() {
    if(platform == 'win32') {
        if(arch == 'x64') {
        } else {
        }
    }
    else if(platform == 'linux') 
    {
        console.log("Architecture = " + arch);
        if(arch == 'x64') {
            return 'jdk-8u181-linux-x64.tar.gz';
        } else {
            return 'jdk-8u181-linux-i586.tar.gz';
        }
    } 
    else if(platform == 'darwin') 
    {
        if(arch == 'x64') {
        }
    }
    throw(`${platform}:${arch} not supported`);
}

// only linux installation is currently supported
if(platform == 'linux') {
    if(!process.env.SKIP_BUILD_JAVA && !checkJDKExists()) {
        installJDK();
    }
} else {
    require('find-java-home')(function(err, home){
        if(err) {
            console.log(err);
        } else {
            console.log(home);
        }
    });
}
