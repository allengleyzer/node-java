if(process.env.SKIP_BUILD_JAVA) {
  process.exit(128);
  
} else {
  const path = require('path');
  const fs = require('fs');

  const workspace = (process.env.WORKSPACE || process.env.INIT_CWD || process.cwd());
  const bridgePath = path.resolve(workspace, './javabridge');

  if (fs.existsSync(bridgePath)) {
    process.exit(128);
  }
}