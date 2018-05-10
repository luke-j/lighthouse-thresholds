# lighthouse-thresholds

This package runs [Google Lighthouse](https://github.com/GoogleChrome/lighthouse) and compares the scores against predetermined thresholds defined an a `.lighthouserc` config file.

## Usage

Create a `.lighthouserc` file in your project root (see the example file [here](#example-lighthouserc-file)).

Run `lighthouse-thresholds` to run Google Lighthouse against your defined URLs and either pass or fail them when comparing with the set thresholds.

Note that there will need to be a locally installed version of chrome (or chromium), for this package to work.

## Config options

| Param                     | Type     | Meaning                                              |
| ------------------------- | -------- | ---------------------------------------------------- |
| `url`                     | _String_ | A full url to run Google Lighthouse against          |
| `thresholds`              | _Object_ | An object containing the predetermined thresholds    |
| `thresholds.performance`  | _Number_ | A threshold for the page's performance score         |
| `thresholds.seo`          | _Number_ | A threshold for the page's performance score         |
| `thresholds.progressive`  | _Number_ | A threshold for the page's progressive/offline score |
| `thresholds.a11y`         | _Number_ | A threshold for the page's accessibility score       |
| `thresholds.bestPractice` | _Number_ | A threshold for the page's best practice score       |

## Example `.lighthouserc` file

```json
[
  {
    "url": "https://google.com/",
    "thresholds": {
      "performance": 90.25,
      "seo": 90.25,
      "progressive": 90.25,
      "a11y": 90.25,
      "bestPractice": 90.25
    }
  }
]
```

Note that this file can also be `.lighthouserc.js`, in which case it must be in the form:

```js
module.exports = { ...config }
```
