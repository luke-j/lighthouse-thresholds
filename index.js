import findConfig from 'find-config'
import { mapValues, keyBy, camelCase } from 'lodash'
import chalk from 'chalk'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const log = str => console.log(chalk.green(str))

const err = error => {
  if (error.length > 0) {
    error.forEach(e => console.log(chalk.bold.red(e)))
  } else {
    console.log(chalk.bold.red(error))
  }

  process.exit(1)
}

const launchChromeAndRunLighthouse = async url => {
  try {
    log(`fetching ${url}`)
    const chromeFlags = ['--headless', '--no-sandbox', '--disable-gpu']
    const chrome = await chromeLauncher.launch({
      chromeFlags,
      connectionPollInterval: 10000
    })
    log('running lighthouse')
    const results = await lighthouse(
      url,
      { chromeFlags, port: chrome.port },
      null
    )

    delete results.artifacts
    await chrome.kill()

    return results
  } catch (e) {
    throw e
  }
}

const parseReport = async (scores, thresholds, url) => {
  const errors = []
  const {
    performance: performanceScore,
    progressiveWebApp: progressiveScore,
    accessibility: a11yScore,
    bestPractices: bestPracticeScore,
    seo: seoScore
  } = scores
  const {
    performance = 0,
    progressive = 0,
    a11y = 0,
    bestPractice = 0,
    seo = 0
  } = thresholds

  if (performance > performanceScore) {
    errors.push(`${url} - Performance: ${performanceScore} < ${performance}`)
  }

  if (progressive > progressiveScore) {
    errors.push(
      `${url} - Progressive Web App: ${progressiveScore} < ${progressive}`
    )
  }

  if (a11y > a11yScore) {
    errors.push(`${url} - a11y: ${a11yScore} < ${a11y}`)
  }

  if (bestPractice > bestPracticeScore) {
    errors.push(
      `${url} - Best Practices: ${bestPracticeScore} < ${bestPractice}`
    )
  }

  if (seo > seoScore) {
    errors.push(`${url} - SEO: ${seoScore} < ${seo}`)
  }

  return errors
}
;(async () => {
  let errors = []
  const config =
    JSON.parse(findConfig.read('.lighthouserc')) ||
    findConfig.require('.lighthouserc.js')

  if (!config) {
    err('Could not find .lighthouserc or .lighthouserc.js config file')
  }

  try {
    await Promise.all(
      config.map(
        ({ url, thresholds }) =>
          new Promise((resolve, reject) =>
            launchChromeAndRunLighthouse(url)
              .then(async ({ reportCategories }) => {
                const normalizeKeys = keyBy(reportCategories, ({ name }) =>
                  camelCase(name)
                )
                const scores = mapValues(normalizeKeys, ({ score }) =>
                  parseFloat(score.toFixed(2))
                )

                log('parsing results')
                const issues = await parseReport(scores, thresholds, url)
                errors = errors.concat(issues)
                resolve()
              })
              .catch(e => {
                reject(e)
              })
          )
      )
    )
  } catch (e) {
    throw e
  }

  if (errors.length) err(errors)

  log('Passed thresholds')
})()
