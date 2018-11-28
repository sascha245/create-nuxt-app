const superb = require('superb')
const glob = require('glob')
const { join } = require('path')
const spawn = require('cross-spawn')

const rootDir = __dirname

const move = (from, to = '') => {
  const result = {}
  const options = { cwd: join(rootDir, 'template'), nodir: true, dot: true }
  for (const file of glob.sync(`${from}/**`, options)) {
    result[file] = (to ? to + '/' : '') + file.replace(`${from}/`, '')
  }
  return result
}

const moveFramework = (answer, to = '') => {
  return answer !== 'none' && move(`frameworks/${answer}`, to);
}

module.exports = {
  prompts: {
    name: {
      message: 'Project name',
      default: ':folderName:'
    },
    description: {
      message: 'Project description',
      default: `My ${superb()} Nuxt.js project`
    },
    server: {
      message: 'Use a custom server framework',
      type: 'list',
      choices: [
        'none',
        'express',
        'koa',
        'adonis',
        'hapi',
        'feathers',
        'micro'
      ],
      default: 'none'
    },
    srcDir: {
      message: 'Choose project source directory',
      type: 'list',
      choices: [
        {
          name: 'none',
          value: ''
        },
        'src'
      ],
      default: '',
      when: (answers) => answers.server !== 'adonis'
    },
    ui: {
      message: 'Use a custom UI framework',
      type: 'list',
      choices: [
        'none',
        'bootstrap',
        'vuetify',
        'bulma',
        'tailwind',
        'element-ui',
        'buefy',
        'ant-design-vue',
        'iview'
      ],
      default: 'none'
    },
    mode: {
      message: 'Choose rendering mode',
      type: 'list',
      choices: [
        { name: 'Universal', value: 'universal' },
        { name: 'Single Page App', value: 'spa' }
      ],
      default: 'universal'
    },
    axios: {
      message: 'Use axios module',
      type: 'list',
      choices: ['no', 'yes'],
      default: 'no'
    },
    eslint: {
      message: 'Use eslint',
      type: 'list',
      choices: ['no', 'yes'],
      default: 'no'
    },
    prettier: {
      message: 'Use prettier',
      type: 'list',
      choices: ['no', 'yes'],
      default: 'no'
    },
    author: {
      type: 'string',
      message: 'Author name',
      default: ':gitUser:',
      store: true
    },
    pm: {
      message: 'Choose a package manager',
      choices: ['npm', 'yarn'],
      type: 'list',
      default: 'npm'
    }
  },
  data: {
    edge: process.argv.includes('--edge')
  },
  filters: {
    'server/index-express.js': 'server === "express"',
    'server/index-koa.js': 'server === "koa"',
    'server/index-adonis.js': 'server === "adonis"',
    'server/index-hapi.js': 'server === "hapi"',
    'server/index-feathers.js': 'server === "feathers"',
    'server/index-micro.js': 'server === "micro"',
    'frameworks/adonis/**': 'server === "adonis"',
    'frameworks/feathers/**': 'server === "feathers"',
    'frameworks/vuetify/**': 'ui === "vuetify"',
    'frameworks/element-ui/**': 'ui === "element-ui"',
    'frameworks/ant-design-vue/**': 'ui === "ant-design-vue"',
    'frameworks/tailwind/**': 'ui === "tailwind"',
    'frameworks/buefy/**': 'ui === "buefy"',
    'frameworks/iview/**': 'ui === "iview"',
    '_.eslintrc.js': 'eslint === "yes"',
    '.prettierrc': 'prettier === "yes"'
  },
  move(answers) {
    const moveable = {
      gitignore: '.gitignore',
      '_package.json': 'package.json',
      '_.eslintrc.js': '.eslintrc.js',
      'server/index-*.js': 'server/index.js'
    }
    let nuxtDir
    if (answers.server === 'adonis') {
      nuxtDir = 'resources'
    } else {
      nuxtDir = answers.srcDir
    }

    let postMoves = null
    if (answers.server === 'adonis') {
      postMoves = {
        'server/index-*.js': 'server.js',
        'nuxt/nuxt.config.js': 'config/nuxt.js'
      }
    } else {
      postMoves = {
        'nuxt/nuxt.config.js': 'nuxt.config.js'
      }
    }

    return Object.assign(
      moveable,
      move('nuxt', nuxtDir),
      moveFramework(answers.server),
      moveFramework(answers.ui, nuxtDir),
      postMoves
    )
  },
  post(
    { npmInstall, yarnInstall, gitInit, chalk, isNewFolder, folderName, folderPath },
    { meta }
  ) {
    gitInit()

    // using yarn or npm
    meta.answers.pm === 'yarn' ? yarnInstall() : npmInstall()

    const cd = () => {
      if (isNewFolder) {
        console.log(`\t${chalk.cyan('cd')} ${folderName}`)
      }
    }
    if (meta.answers.eslint === 'yes') {
      spawn.sync(meta.answers.pm, ['run','lint', '--', '--fix'], {
        cwd: folderPath,
        stdio: 'inherit'
      })
    }

    console.log()
    console.log(chalk.bold(`\tTo get started:\n`))
    cd()
    console.log(`\t ${meta.answers.pm} run dev\n`)
    console.log(chalk.bold(`  To build & start for production:\n`))
    cd()
    console.log(`\t ${meta.answers.pm} run build`)
    console.log(`\t ${meta.answers.pm} start`)
    console.log()
  }
}
