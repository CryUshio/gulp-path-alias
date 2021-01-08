import foo from 'libs';
import foo from './libs';
import foo from './libs/foo';
import foo from '@libs-b/foo';
import foo from 'src/@libs';
import foo from '@lib/foo';
import{a}from'./libs/a';

import('libs');
import('./libs');
import('./libs/foo');
import('@libs-b/foo');
import('src/@libs');
import('@lib/foo');
require('../utils/b');
const b = require('../utils/b');
