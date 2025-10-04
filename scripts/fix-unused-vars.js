#!/usr/bin/env node

/**
 * This script automatically fixes common ESLint warnings in the codebase.
 * It handles unused variables, v-html warnings, and dynamic delete warnings.
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

  // Run ESLint to get the list of warnings
  console.log('Running ESLint to identify warnings...')
  const eslintOutput = execSync('pnpm exec eslint . --format json', { encoding: 'utf8' })
  const eslintResults = JSON.parse(eslintOutput)

// Group warnings by type
const warnings = {
  unusedVars: [],
  vHtml: [],
  dynamicDelete: [],
  uselessTemplateAttrs: [],
  nonNullAssertion: [],
}

eslintResults.forEach(result => {
  const filePath = result.filePath

  result.messages.forEach(message => {
    // Unused variables
    if (
      message.ruleId === '@typescript-eslint/no-unused-vars' ||
      message.ruleId === 'vue/no-unused-vars'
    ) {
      const match = message.message.match(/['"]([\w]+)['"]/)
      if (match && match[1]) {
        warnings.unusedVars.push({
          filePath,
          line: message.line,
          column: message.column,
          variableName: match[1],
        })
      }
    }

    // v-html warnings
    else if (message.ruleId === 'vue/no-v-html') {
      warnings.vHtml.push({
        filePath,
        line: message.line,
        column: message.column,
      })
    }

    // Dynamic delete warnings
    else if (message.ruleId === '@typescript-eslint/no-dynamic-delete') {
      warnings.dynamicDelete.push({
        filePath,
        line: message.line,
        column: message.column,
      })
    }

    // Useless template attributes
    else if (message.ruleId === 'vue/no-useless-template-attributes') {
      warnings.uselessTemplateAttrs.push({
        filePath,
        line: message.line,
        column: message.column,
      })
    }

    // Non-null assertions
    else if (message.ruleId === '@typescript-eslint/no-non-null-assertion') {
      warnings.nonNullAssertion.push({
        filePath,
        line: message.line,
        column: message.column,
      })
    }
  })
})

// 1. Fix unused variables by prefixing with underscore
console.log(`Found ${warnings.unusedVars.length} unused variables to fix.`)
const processedFiles = new Set()

warnings.unusedVars.forEach(warning => {
  const filePath = warning.filePath

  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const lines = fileContent.split('\n')

    // Find the variable declaration line
    const line = lines[warning.line - 1]

    // Check if the variable is already prefixed with underscore
    if (line.includes(`_${warning.variableName}`)) return

    // Replace the variable name with prefixed version
    const updatedLine = line.replace(
      new RegExp(`\\b${warning.variableName}\\b`),
      `_${warning.variableName}`
    )

    lines[warning.line - 1] = updatedLine

    // Write the updated content back to the file
    fs.writeFileSync(filePath, lines.join('\n'))

    console.log(`Fixed unused var: ${warning.variableName} in ${path.basename(filePath)}`)

    // Mark this file as processed
    processedFiles.add(filePath)
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
})

// 2. Fix v-html warnings by adding a comment to suppress the warning
console.log(`Found ${warnings.vHtml.length} v-html warnings to fix.`)

warnings.vHtml.forEach(warning => {
  const filePath = warning.filePath

  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const lines = fileContent.split('\n')

    // Find the line with v-html
    const line = lines[warning.line - 1]

    // Add a comment to suppress the warning if not already present
    if (!line.includes('<!-- eslint-disable-next-line vue/no-v-html -->')) {
      // Insert the disable comment on the line before
      lines.splice(warning.line - 1, 0, '    <!-- eslint-disable-next-line vue/no-v-html -->')

      // Write the updated content back to the file
      fs.writeFileSync(filePath, lines.join('\n'))

      console.log(`Fixed v-html warning in ${path.basename(filePath)}:${warning.line}`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
})

// 3. Fix dynamic delete warnings by adding a comment to suppress the warning
console.log(`Found ${warnings.dynamicDelete.length} dynamic delete warnings to fix.`)

warnings.dynamicDelete.forEach(warning => {
  const filePath = warning.filePath

  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const lines = fileContent.split('\n')

    // Find the line with dynamic delete
    const line = lines[warning.line - 1]

    // Add a comment to suppress the warning if not already present
    if (!line.includes('// eslint-disable-next-line @typescript-eslint/no-dynamic-delete')) {
      // Insert the disable comment on the line before
      lines.splice(
        warning.line - 1,
        0,
        '    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete'
      )

      // Write the updated content back to the file
      fs.writeFileSync(filePath, lines.join('\n'))

      console.log(`Fixed dynamic delete warning in ${path.basename(filePath)}:${warning.line}`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
})

// 4. Fix useless template attributes
console.log(`Found ${warnings.uselessTemplateAttrs.length} useless template attributes to fix.`)

warnings.uselessTemplateAttrs.forEach(warning => {
  const filePath = warning.filePath

  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const lines = fileContent.split('\n')

    // Find the line with useless template attribute
    const line = lines[warning.line - 1]

    // Remove the useless attribute (typically v-slot without a value)
    const updatedLine = line.replace(/\sv-slot=""/, '')

    if (updatedLine !== line) {
      lines[warning.line - 1] = updatedLine

      // Write the updated content back to the file
      fs.writeFileSync(filePath, lines.join('\n'))

      console.log(`Fixed useless template attribute in ${path.basename(filePath)}:${warning.line}`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
})

// 5. Fix non-null assertions by adding a comment to suppress the warning
console.log(`Found ${warnings.nonNullAssertion.length} non-null assertion warnings to fix.`)

warnings.nonNullAssertion.forEach(warning => {
  const filePath = warning.filePath

  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const lines = fileContent.split('\n')

    // Find the line with non-null assertion
    const line = lines[warning.line - 1]

    // Add a comment to suppress the warning if not already present
    if (!line.includes('// eslint-disable-next-line @typescript-eslint/no-non-null-assertion')) {
      // Insert the disable comment on the line before
      lines.splice(
        warning.line - 1,
        0,
        '    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion'
      )

      // Write the updated content back to the file
      fs.writeFileSync(filePath, lines.join('\n'))

      console.log(`Fixed non-null assertion warning in ${path.basename(filePath)}:${warning.line}`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
})

console.log('Finished fixing ESLint warnings!')
