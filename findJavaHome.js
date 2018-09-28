const os = require('os');
let platform = os.platform();
if(platform == 'linux') {
  const basePath = process.env.WORKSPACE || process.env.CWD_INIT || '/home/vcap/app';
  process.stdout.write(basePath + '/jdk')
} else {
  require('find-java-home')(function(err, home){
    if(err){
      console.error("[node-java] "+err);
      process.exit(1);
    }
    process.stdout.write(home);
  });
}