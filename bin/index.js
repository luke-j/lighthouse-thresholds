#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var findConfig = _interopDefault(require('find-config'));
var lodash = require('lodash');
var chalk = _interopDefault(require('chalk'));
var lighthouse = _interopDefault(require('lighthouse'));
var chromeLauncher = require('chrome-launcher');
var chromium = require('chromium');

const log = str => console.log(chalk.green(str));

const err = error => {
  if (error.length > 0) {
    error.forEach(e => console.log(chalk.bold.red(e)));
  } else {
    console.log(chalk.bold.red(error));
  }

  process.exit(1);
};

const launchChromeAndRunLighthouse = async url => {
  const chromeFlags = ['--headless', '--no-sandbox', '--disable-gpu'];
  const chrome = await chromeLauncher.launch({
    chromeFlags,
    chromePath: chromium.path,
    connectionPollInterval: 10000
  });
  const results = await lighthouse(
    url,
    { chromeFlags, port: chrome.port },
    null
  );

  delete results.artifacts;
  await chrome.kill();

  return results
};

const parseReport = async (scores, thresholds, url) => {
  const errors = [];
  const {
    performance: performanceScore,
    progressiveWebApp: progressiveScore,
    accessibility: a11yScore,
    bestPractices: bestPracticeScore,
    seo: seoScore
  } = scores;
  const {
    performance = 0,
    progressive = 0,
    a11y = 0,
    bestPractice = 0,
    seo = 0
  } = thresholds;

  if (performance > performanceScore) {
    errors.push(`${url} - Performance: ${performanceScore} < ${performance}`);
  }

  if (progressive > progressiveScore) {
    errors.push(
      `${url} - Progressive Web App: ${progressiveScore} < ${progressive}`
    );
  }

  if (a11y > a11yScore) {
    errors.push(`${url} - a11y: ${a11yScore} < ${a11y}`);
  }

  if (bestPractice > bestPracticeScore) {
    errors.push(
      `${url} - Best Practices: ${bestPracticeScore} < ${bestPractice}`
    );
  }

  if (seo > seoScore) {
    errors.push(`${url} - SEO: ${seoScore} < ${seo}`);
  }

  return errors
}
;(async () => {
  let errors = [];
  const config =
    JSON.parse(findConfig.read('.lighthouserc')) ||
    findConfig.require('.lighthouserc.js');

  if (!config) {
    err('Could not find .lighthouserc or .lighthouserc.js config file');
  }

  try {
    await Promise.all(
      config.map(
        ({ url, thresholds }) =>
          new Promise((resolve, reject) =>
            launchChromeAndRunLighthouse(url)
              .then(async ({ reportCategories }) => {
                const normalizeKeys = lodash.keyBy(reportCategories, ({ name }) =>
                  lodash.camelCase(name)
                );
                const scores = lodash.mapValues(normalizeKeys, ({ score }) =>
                  parseFloat(score.toFixed(2))
                );

                const issues = await parseReport(scores, thresholds, url);
                errors = errors.concat(issues);
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
