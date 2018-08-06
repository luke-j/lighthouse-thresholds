import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

import { log } from './util'

export const launchChromeAndRunLighthouse = async (url, runs) => {
  try {
    log(`fetching ${url}`)
    const chromeFlags = ['--headless', '--no-sandbox', '--disable-gpu']
    const chrome = await chromeLauncher.launch({
      chromeFlags,
      connectionPollInterval: 10000
    })
    const results = await Promise.all(
      Array(runs)
        .fill()
        .map(async (el, i) => {
          log(`running lighthouse - run ${i + 1}`)
          const run = await lighthouse(
            url,
            { chromeFlags, port: chrome.port },
            null
          )

          delete run.artifacts

          return run
        })
    )

    await chrome.kill()

    return results
  } catch (e) {
    throw e
  }
}
