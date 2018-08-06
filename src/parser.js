import { keys, intersection } from 'lodash'

import { log } from './util'

export const parseMetrics = (audits, thresholds, url) => {
  const metrics = intersection(keys(audits), keys(thresholds))

  return metrics.map(metric => {
    const { scoreDisplayMode, rawValue } = audits[metric]
    const numeric = scoreDisplayMode === 'numeric'
    const binary = scoreDisplayMode === 'binary'

    if (numeric) {
      const threshold = parseFloat(thresholds[metric].replace(/>|</g, ''), 2)
      const isGreaterThan = thresholds[metric].startsWith('>')
      const isLessThan = thresholds[metric].startsWith('<')
      const failedGreaterThan = isGreaterThan && rawValue < threshold
      const failedLessThan = isLessThan && rawValue > threshold

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
}
