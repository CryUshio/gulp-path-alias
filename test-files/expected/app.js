import foo from 'libs';
import foo from './libs/index';
import foo from './libs/foo';
import foo from '@libs-b/foo';
import foo from 'src/@libs';
import foo from '@lib/foo';
import{a}from'./libs/a';

import('libs');
import('./libs/index');
import('./libs/foo');
import('@libs-b/foo');
import('src/@libs');
import('@lib/foo');
require('../utils/b');
const b = require('../utils/b');
require('../utils/lib/b');
require('@path/to/some/where');

require('../utils/b');require('../utils/b');
