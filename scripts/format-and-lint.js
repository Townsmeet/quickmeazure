#!/usr/bin/env node

/**
 * This script runs Prettier and ESLint on the codebase
 * It can be used to quickly format and lint the entire codebase
 * or specific files/directories
 */

import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

// Parse command line arguments
const args = process.argv.slice(2)
const hasFixFlag = args.includes('--fix')
const hasFormatFlag = args.includes('--format')
const hasLintFlag = args.includes('--lint')
const hasVerboseFlag = args.includes('--verbose')

// If no specific flags are provided, run both format and lint
const runFormat = hasFormatFlag || (!hasLintFlag && !hasFormatFlag)
const runLint = hasLintFlag || (!hasLintFlag && !hasFormatFlag)

// Get target paths (excluding flags)
const targetPaths = args.filter(arg => !arg.startsWith('--'))
const targetPathsArg = targetPaths.length > 0 ? targetPaths.join(' ') : '.'

// Helper function to run a command and log output
function runCommand(command, description) {
  console.log(`\n🚀 ${description}...`)

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: hasVerboseFlag ? 'inherit' : 'pipe',
    })

    if (hasVerboseFlag) {
      // Output already shown via stdio: 'inherit'
    } else if (output.trim()) {
      console.log(output.trim())
    }

    console.log(`✅ ${description} completed successfully`)
    return true
  } catch (error) {
    console.error(`❌ ${description} failed`)

    if (!hasVerboseFlag && error.stdout) {
      console.error(error.stdout.toString())
    }

    return false
  }
}

console.log('🧹 Code Quality Tool')
console.log('===================')

let success = true

if (runFormat) {
  const formatCommand = `pnpm exec prettier ${hasFixFlag ? '--write' : '--check'} ${targetPathsArg}`
  const formatDesc = `Running Prettier ${hasFixFlag ? 'to format code' : 'to check formatting'}`
  success = runCommand(formatCommand, formatDesc) && success
}

if (runLint) {
  const lintCommand = `pnpm exec eslint ${hasFixFlag ? '--fix' : ''} ${targetPathsArg}`
  const lintDesc = `Running ESLint ${hasFixFlag ? 'to fix issues' : 'to check for issues'}`
  success = runCommand(lintCommand, lintDesc) && success
}

// Summary
console.log('\n===================')
if (success) {
  console.log('✨ All tasks completed successfully!')
} else {
  console.log('⚠️ Some tasks reported issues. Please review the output above.')
  process.exit(1)
}
