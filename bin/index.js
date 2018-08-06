#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var chalk = _interopDefault(require('chalk'));
var lodash = require('lodash');
var lighthouse = _interopDefault(require('lighthouse'));
var chromeLauncher = require('chrome-launcher');
var findConfig = _interopDefault(require('find-config'));

const log = str => console.log(chalk.green(str));

const err = error => {
  if (error.length > 0) {
    error.forEach(e => console.log(chalk.bold.red(e)));
  } else {
    console.log(chalk.bold.red(error));
  }

  process.exit(1);
};

const parseMetrics = (audits, thresholds, url) => {
  const metrics = lodash.intersection(lodash.keys(audits), lodash.keys(thresholds));

  return metrics.map(metric => {
    const { scoreDisplayMode, rawValue } = audits[metric];
    const numeric = scoreDisplayMode === 'numeric';
    const binary = scoreDisplayMode === 'binary';

    if (numeric) {
      const threshold = parseFloat(thresholds[metric].replace(/>|</g, ''), 2);
      const isGreaterThan = thresholds[metric].startsWith('>');
      const isLessThan = thresholds[metric].startsWith('<');
      const failedGreaterThan = isGreaterThan && rawValue < threshold;
      const failedLessThan = isLessThan && rawValue > threshold;

      if (failedGreaterThan || failedLessThan) {
        return `${url} - ${metric} failed: ${parseFloat(rawValue, 2) +
          thresholds[metric]}`
      }
    }

    if (binary && rawValue !== thresholds[metric]) {
      return `${url} - ${metric} failed: expected ${
        thresholds[metric]
      }, got ${rawValue}`
    }
  })
};

const launchChromeAndRunLighthouse = async (url, runs) => {
  try {
    log(`fetching ${url}`);
    const chromeFlags = ['--headless', '--no-sandbox', '--disable-gpu'];
    const chrome = await chromeLauncher.launch({
      chromeFlags,
      connectionPollInterval: 10000
    });
    const results = await Promise.all(
      Array(runs)
        .fill()
        .map(async (el, i) => {
          log(`running lighthouse - run ${i + 1}`);
          const run = await lighthouse(
            url,
            { chromeFlags, port: chrome.port },
            null
          );

          delete run.artifacts;

          return run
        })
    );

    await chrome.kill();

    return results
  } catch (e) {
    throw e
  }
};

(async () => {
  const errors = [];
  const config =
    JSON.parse(findConfig.read('.lighthouserc')) ||
    findConfig.require('.lighthouserc.js');

  if (!config) {
    err('Could not find .lighthouserc or .lighthouserc.js config file');
  }

  try {
    await Promise.all(
      config.map(
        ({ url, thresholds, runs = 1 }) =>
          new Promise((resolve, reject) =>
            launchChromeAndRunLighthouse(url, runs)
              .then(results => {
                results.forEach(({ lhr: { audits, categories } }) => {
                  errors.push(...parseMetrics(audits, thresholds, url));
                });

                resolve();
              })
              .catch(e => {
                reject(e);
              })
          )
      )
    );
  } catch (e) {
    throw e
  }

  if (errors.length) err(errors);

  log('Passed thresholds');
})();
