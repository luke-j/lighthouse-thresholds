import findConfig from 'find-config'

import { log, err } from './src/util'
import { parseMetrics } from './src/parser'
import { launchChromeAndRunLighthouse } from './src/lighthouse'
;(async () => {
  const errors = []
  const config =
    JSON.parse(findConfig.read('.lighthouserc')) ||
    findConfig.require('.lighthouserc.js')

  if (!config) {
    err('Could not find .lighthouserc or .lighthouserc.js config file')
  }

  try {
    await Promise.all(
      config.map(
        ({ url, thresholds, runs = 1 }) =>
          new Promise((resolve, reject) =>
            launchChromeAndRunLighthouse(url, runs)
              .then(results => {
                results.forEach(({ lhr: { audits, categories } }) => {
                  errors.push(...parseMetrics(audits, thresholds, url))
                })

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
