'use strict'

const childProcess = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const esbuild = require('esbuild')

const REPOSITORY = 'https://github.com/SmileLee-lyx/ne-rewritten'
const COMMIT = '5413a94f0c5b6b56b4c13a91a8acf3a794698bb9'
const EXPECTED_NOTATION_COUNT = 105
const EXPECTED_DIRECT_COUNT = 73
const EXPECTED_GENERATED_COUNT = 32
const projectRoot = path.resolve(__dirname, '..')
const entryPath = path.join(__dirname, 'ne-rewritten-bundle.entry.ts')
const outputPath = path.join(projectRoot, 'js', 'ne-rewritten-notation-bundle.js')

function usage() {
  return [
    'Usage: node scripts/build-ne-rewritten-bundle.js [--source PATH] [--check]',
    '',
    '  --source PATH  Checkout of ne-rewritten at the pinned commit.',
    '                 Defaults to ../ne-rewritten-source or NE_REWRITTEN_SOURCE.',
    '  --check        Verify that the committed bundle is current without writing it.',
  ].join('\n')
}

function parseArgs(argv) {
  let source
  let check = false

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--check') {
      check = true
    } else if (arg === '--source') {
      source = argv[++index]
      if (!source) throw new Error('--source requires a path.\n\n' + usage())
    } else if (arg.startsWith('--source=')) {
      source = arg.slice('--source='.length)
      if (!source) throw new Error('--source requires a path.\n\n' + usage())
    } else if (arg === '--help' || arg === '-h') {
      console.log(usage())
      process.exit(0)
    } else {
      throw new Error('Unknown argument: ' + arg + '\n\n' + usage())
    }
  }

  const defaultSource = path.resolve(projectRoot, '..', 'ne-rewritten-source')
  return {
    source: path.resolve(source || process.env.NE_REWRITTEN_SOURCE || defaultSource),
    check,
  }
}

function git(source, args) {
  return childProcess.execFileSync('git', ['-C', source].concat(args), {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function validateSource(source) {
  if (!fs.existsSync(path.join(source, 'src', 'notations'))) {
    throw new Error('Not an ne-rewritten source checkout: ' + source)
  }

  let head
  try {
    head = git(source, ['rev-parse', 'HEAD'])
  } catch (error) {
    const detail = error.stderr ? String(error.stderr).trim() : error.message
    throw new Error('Cannot read the upstream git revision at ' + source + ': ' + detail)
  }

  if (head !== COMMIT) {
    throw new Error(
      'Upstream checkout is at ' + head + ', expected pinned commit ' + COMMIT + '.\n' +
      'Use --source with a checkout of ' + REPOSITORY + ' at that commit.'
    )
  }

  const trackedChanges = git(source, ['status', '--short', '--untracked-files=no'])
  if (trackedChanges) {
    throw new Error(
      'Upstream checkout has tracked changes, so it is not an exact copy of pinned commit ' + COMMIT + ':\n' +
      trackedChanges
    )
  }
}

function normalize(source) {
  return source.replace(/\r\n/g, '\n')
}

function validateInputs(inputs) {
  const allowed = [
    /^notation-explorer-ne-rewritten-entry\.ts$/,
    /^src\/notations\//,
    /^src\/notation-definition\.ts$/,
    /^src\/utils\.ts$/,
    /^src\/core\/(diagram_types|notation_category)\.ts$/,
  ]
  const forbidden = Object.keys(inputs).filter((input) => {
    const normalized = input.replace(/\\/g, '/')
    return !allowed.some((pattern) => pattern.test(normalized))
  })
  if (forbidden.length) {
    throw new Error(
      'Algorithm bundle reached files outside the pure ne-rewritten allowlist:\n' +
      forbidden.map((input) => '  ' + input).join('\n')
    )
  }
}

function validateBundle(source) {
  const context = Object.create(null)
  context.globalThis = context
  vm.runInNewContext(source, context, { filename: outputPath })

  const bundle = context.NeRewrittenNotationBundle
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('Generated bundle did not expose globalThis.NeRewrittenNotationBundle.')
  }
  if (bundle.source.repository !== REPOSITORY || bundle.source.commit !== COMMIT) {
    throw new Error('Generated bundle source metadata does not match the pinned upstream.')
  }
  if (!Array.isArray(bundle.notations) || bundle.notations.length !== EXPECTED_NOTATION_COUNT) {
    throw new Error(
      'Generated bundle has ' + (bundle.notations && bundle.notations.length) +
      ' notations; expected ' + EXPECTED_NOTATION_COUNT + '.'
    )
  }
  if (
    !bundle.counts ||
    bundle.counts.direct !== EXPECTED_DIRECT_COUNT ||
    bundle.counts.generated !== EXPECTED_GENERATED_COUNT ||
    bundle.counts.total !== EXPECTED_NOTATION_COUNT
  ) {
    throw new Error('Generated bundle direct/generated counts do not match the pinned inventory.')
  }
  if (
    !Array.isArray(bundle.generatedNotationIds) ||
    bundle.generatedNotationIds.length !== EXPECTED_GENERATED_COUNT
  ) {
    throw new Error('Generated bundle does not identify all default generator outputs.')
  }
  if (bundle.schemaVersion !== 2 || typeof bundle.createGeneratedNotation !== 'function') {
    throw new Error('Generated bundle does not expose the version 2 generator API.')
  }
  if (!bundle.categoriesById || !Array.isArray(bundle.generatorCategoryIds)) {
    throw new Error('Generated bundle does not expose category indexes for generators.')
  }

  const rematerializedIds = []
  bundle.generatorCategoryIds.forEach((categoryId) => {
    const category = bundle.categoriesById[categoryId]
    if (
      !category || !category.generator ||
      !Number.isSafeInteger(category.generator.start) ||
      !Number.isSafeInteger(category.generator.initial) ||
      category.generator.initial < category.generator.start ||
      typeof category.generator.create !== 'function'
    ) {
      throw new Error('Generated bundle contains invalid generator metadata for ' + categoryId + '.')
    }
    for (let index = category.generator.start; index <= category.generator.initial; index++) {
      const notation = bundle.createGeneratedNotation(categoryId, index)
      if (!notation || notation.category_id !== categoryId) {
        throw new Error('Generated bundle returned an invalid notation for ' + categoryId + '[' + index + '].')
      }
      rematerializedIds.push(notation.id)
    }
  })
  if (JSON.stringify(rematerializedIds) !== JSON.stringify(bundle.generatedNotationIds)) {
    throw new Error('Generated bundle generator API does not reproduce the default inventory.')
  }

  const partialUpms = bundle.categoriesById['category-upms-partial']
  const nextPartialUpms = bundle.createGeneratedNotation(
    partialUpms.id,
    partialUpms.generator.initial + 1
  )
  if (nextPartialUpms.id !== 'upms-partial-4') {
    throw new Error('Generated bundle cannot materialize a non-default (>n)-UPMS variant.')
  }

  const ids = bundle.notations.map((notation) => notation && notation.id)
  const uniqueIds = new Set(ids)
  if (ids.some((id) => typeof id !== 'string' || id.length === 0) || uniqueIds.size !== ids.length) {
    throw new Error('Generated bundle contains a missing or duplicate notation id.')
  }
  if (!bundle.notationsById || Object.keys(bundle.notationsById).length !== ids.length) {
    throw new Error('Generated bundle id index does not match its notation list.')
  }
}

async function build(source) {
  const entry = fs.readFileSync(entryPath, 'utf8')
  const result = await esbuild.build({
    stdin: {
      contents: entry,
      loader: 'ts',
      resolveDir: source,
      sourcefile: 'notation-explorer-ne-rewritten-entry.ts',
    },
    absWorkingDir: source,
    tsconfig: path.join(source, 'tsconfig.json'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    treeShaking: true,
    legalComments: 'none',
    minify: false,
    metafile: true,
    write: false,
    banner: {
      js: '// Generated from ' + REPOSITORY + '\n// Pinned commit: ' + COMMIT + '\n// Run: npm run build:ne-rewritten-notations -- --source <checkout>',
    },
  })

  if (result.outputFiles.length !== 1) {
    throw new Error('Expected one JavaScript output, received ' + result.outputFiles.length + '.')
  }
  validateInputs(result.metafile.inputs)
  const generated = normalize(result.outputFiles[0].text)
  validateBundle(generated)
  return generated
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  validateSource(options.source)
  const generated = await build(options.source)
  const current = fs.existsSync(outputPath) ? normalize(fs.readFileSync(outputPath, 'utf8')) : ''

  if (options.check) {
    if (current !== generated) {
      console.error('ne-rewritten notation bundle is stale. Rebuild it with:')
      console.error('  npm run build:ne-rewritten-notations -- --source "' + options.source + '"')
      process.exitCode = 1
      return
    }
    console.log('ne-rewritten notation bundle is current (' + EXPECTED_NOTATION_COUNT + ' unique ids).')
    return
  }

  if (current !== generated) fs.writeFileSync(outputPath, generated, 'utf8')
  console.log(
    (current === generated ? 'Verified' : 'Generated') + ' ' +
    path.relative(projectRoot, outputPath) + ' (' + EXPECTED_NOTATION_COUNT + ' unique ids).'
  )
}

main().catch((error) => {
  console.error(error && error.stack || error)
  process.exitCode = 1
})
