var glob = require('glob');
var fs = require('fs');
var path = require('path');
var os = require('os');

const platform = os.platform();

require('find-java-home')(function(err, home){
  var dll;
  var dylib;
  var so,soFiles;
  var binary;

  const workspace = (process.env.WORKSPACE || process.env.INIT_CWD || process.cwd());
  // use manually installed jdk on linux
  if(platform == 'linux') {
    home = path.resolve(workspace, './jdk');
  }

  if(home){
    dll = glob.sync('**/jvm.dll', {cwd: home})[0];
    dylib = glob.sync('**/libjvm.dylib', {cwd: home})[0];
    soFiles = glob.sync('**/libjvm.so', {cwd: home});

    if(soFiles.length > 0) {
      so = getCorrectSoForPlatform(soFiles);
    }

    binary = dll || dylib || so;

    let binaryPath;
    // use relative path for linux, full path for other operating systems
    if(platform == 'linux') {
      binaryPath = path.dirname(binary);
    } else {
      binaryPath = path.dirname(path.resolve(home, binary));
    }

    fs.writeFileSync(
      path.resolve(__dirname, './build/jvm_dll_path.json'),
      binary
      ? JSON.stringify(binaryPath)
      : '""'
    );

    var buildPath = path.resolve(__dirname, './build/');
    var targetPath;
    try {
      targetPath = path.resolve(workspace, './javabridge');
    } catch(e) {
      console.log(e);
      targetPath = '../../javabridge';
    }

    fs.renameSync(buildPath, targetPath);
  }
});

function getCorrectSoForPlatform(soFiles){
  var so = _getCorrectSoForPlatform(soFiles);
  if (so) {
    so = removeDuplicateJre(so);
  }
  return so;
}

function removeDuplicateJre(filePath){
  while(filePath.indexOf('jre/jre')>=0){
    filePath = filePath.replace('jre/jre','jre');
  }
  return filePath;
}

function _getCorrectSoForPlatform(soFiles){
  
  var architectureFolderNames = {
    'ia32': 'i386',
    'x64': 'amd64'
  };

  if(platform != 'sunos')
    return soFiles[0];

  var requiredFolderName = architectureFolderNames[os.arch()];
  console.log(`requiredFolderName = ${requiredFolderName}`)
  for (var i = 0; i < soFiles.length; i++) {
    var so = soFiles[i];

    if(so.indexOf('server')>0)
      if(so.indexOf(requiredFolderName)>0)
        console.log(`server so = ${so}`)
        return so;
  }

  return soFiles[0];
}
