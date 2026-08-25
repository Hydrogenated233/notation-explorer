'use strict'

const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.join(__dirname, '..')
const docs = fs.readFileSync(path.join(projectRoot, 'docs', 'making-a-notation.md'), 'utf8')
const prssTemplate = fs.readFileSync(path.join(projectRoot, 'docs', 'example-PrSS.js'), 'utf8')
const constraints = [
   'Local notation source is a whole JavaScript file. Keep it self-contained and wrap it in an IIFE.',
   'Use register.push(...) for legacy notation objects or register_notation(...) for ne-rewritten objects.',
   'Main and analysis registrations use separate namespaces; IDs must be unique within each namespace.',
   'A main notation normally supplies id, name, display, fromDisplay, able, compare, FS, and init.',
   'FS(expr, n) returns the nth fundamental-sequence term, with n a non-negative integer, and must handle Infinity/Limit.',
   'init() returns the initial expansion roots; FS and display must preserve the notation expression contract.',
   'Generated source is an untrusted local file. Never execute, trust, enable, or replace a live file automatically.',
   'The user must review the source and use the existing Trust and run flow before it executes with page privileges.',
].join('\n')

function jsString(value) {
   return JSON.stringify(String(value))
}

const context = [
   '## Built-in notation authoring guide (docs/making-a-notation.md)',
   docs,
   '## Built-in PrSS template (docs/example-PrSS.js / PrSSTemplate.DEFAULT_SOURCE)',
   prssTemplate,
   '## Registration and FS constraints',
   constraints,
].join('\n\n')
const assistantPath = path.join(projectRoot, 'js', 'ai-notation-assistant.js')
const assistant = fs.readFileSync(assistantPath, 'utf8')
const marker = /var BUILTIN_CONTEXT = (?:''|"(?:\\.|[^"\\])*")/
if (!marker.test(assistant)) {
   throw new Error('ai-notation-assistant.js is missing the BUILTIN_CONTEXT marker.')
}
fs.writeFileSync(
   assistantPath,
   assistant.replace(marker, function () { return 'var BUILTIN_CONTEXT = ' + jsString(context) })
)
