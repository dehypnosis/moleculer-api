"use strict";

const moduleName = process.argv[2] || "moleculer";
process.argv.splice(2, 1);

import("./" + moduleName);
