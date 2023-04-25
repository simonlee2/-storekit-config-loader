#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generator } from './core.js';

const argv = yargs(hideBin(process.argv))
  .command(
    'generate',
    'Generate StoreKit configuration',
    (yargs) => {
      yargs
        .option('output', {
          alias: 'o',
          type: 'string',
          description: 'Output path for the configuration file',
          demandOption: true,
        })
        .option('app-id', {
          alias: 'a',
          type: 'string',
          description: 'App ID to generate the StoreKit configuration',
          demandOption: true,
        })
        .option('issuer-id', {
          alias: 'i',
          type: 'string',
          description: 'Issuer ID to generate the StoreKit configuration',
          demandOption: true,
        })
        .option('api-key', {
          alias: 'k',
          type: 'string',
          description: 'API Key to generate the StoreKit configuration',
          demandOption: true,
        })
        .option('private-key', {
          alias: 'p',
          type: 'string',
          description: 'Private Key to generate the StoreKit configuration',
          demandOption: true,
        });
    },
    async (argv) => {
      const filename = argv.output;
      const appId = argv['app-id'];
      const issuerId = argv['issuer-id'];
      const apiKey = argv['api-key'];
      const privateKey = argv['private-key'].replace(/\\n/g, '\n');;

      const { generate } = await generator({ appId, issuerId, apiKey, privateKey });

      generate(filename);
    }
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .alias('help', 'h')
  .argv;
