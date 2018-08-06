import chalk from 'chalk'

export const log = str => console.log(chalk.green(str))

export const err = error => {
  if (error.length > 0) {
    error.forEach(e => console.log(chalk.bold.red(e)))
  } else {
    console.log(chalk.bold.red(error))
  }

  process.exit(1)
}
