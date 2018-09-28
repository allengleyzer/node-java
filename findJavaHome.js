const os = require('os');
const path = require('path');

let platform = os.platform();
if(platform == 'linux') {
  const basePath = process.env.WORKSPACE || process.env.INIT_CWD || process.cwd();
  const jdkPath = path.join(basePath, './jdk');

  process.stdout.write(jdkPath);
} else {
  require('find-java-home')(function(err, home){
    if(err){
      console.error("[node-java] "+err);
      process.exit(1);
    }
    process.stdout.write(home);
  });
}