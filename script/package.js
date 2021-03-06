'use strict';

require('shelljs/global');
const fs = require('fs');

const json = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`));
const vNocturn  = json['version'];
const vElectron = json['devDependencies']['electron-prebuilt'];

exec('rm -rf packages');
exec(
  `electron-packager . Nocturn --arch=ia32,x64 --out=packages/v${vNocturn} ` +
  `--platform=darwin,linux,win32 --version=${vElectron} --ignore=.DS_Store --ignore=accounts.json ` +
  '--ignore=packages/* --ignore=node_modules/bower --ignore=node_modules/electron* ' +
  '--ignore=node_modules/babel* --ignore=node_modules/gulp* '
);
