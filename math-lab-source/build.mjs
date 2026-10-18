import {cpSync} from 'node:fs';
import './scripts/build-math-lab.mjs';
cpSync('dist/math-lab','../math-lab',{recursive:true});
