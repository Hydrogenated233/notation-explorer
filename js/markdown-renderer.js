;(function(root, factory) {
   var api = factory()

   if (typeof module === 'object' && module.exports) module.exports = api
   if (root) root.MarkdownRenderer = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
   'use strict'

   function escapeHtml(value) {
      return String(value == null ? '' : value)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;')
   }

   function safeLinkTarget(value, baseUrl) {
      var href = String(value == null ? '' : value).trim()
      if (!href || /[\u0000-\u001f\u007f]/.test(href)) return null
      try {
         var url = baseUrl ? new URL(href, baseUrl) : new URL(href)
         return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
      } catch (error) {
         return null
      }
   }

   function findLinkTargetEnd(source, start) {
      var depth = 1
      for (var index = start; index < source.length; index++) {
         if (source[index] === '(') depth++
         if (source[index] !== ')') continue
         depth--
         if (depth === 0) return index
      }
      return -1
   }

   function renderInline(value, options) {
      var source = String(value == null ? '' : value)
      var html = ''
      var index = 0

      while (index < source.length) {
         if (source[index] === '`') {
            var codeEnd = source.indexOf('`', index + 1)
            if (codeEnd !== -1) {
               html += '<code>' + escapeHtml(source.slice(index + 1, codeEnd)) + '</code>'
               index = codeEnd + 1
               continue
            }
         }

         if (source.slice(index, index + 2) === '**') {
            var strongEnd = source.indexOf('**', index + 2)
            if (strongEnd !== -1) {
               html += '<strong>' + renderInline(source.slice(index + 2, strongEnd), options) + '</strong>'
               index = strongEnd + 2
               continue
            }
         }

         if (source[index] === '[') {
            var labelEnd = source.indexOf('](', index + 1)
            var targetEnd = labelEnd === -1 ? -1 : findLinkTargetEnd(source, labelEnd + 2)
            if (targetEnd !== -1) {
               var label = source.slice(index + 1, labelEnd)
               var target = safeLinkTarget(source.slice(labelEnd + 2, targetEnd), options && options.baseUrl)
               if (target) {
                  html += '<a href="' + escapeHtml(target) + '" target="_blank" rel="noopener noreferrer">' +
                     renderInline(label, options) + '</a>'
               } else {
                  html += escapeHtml(label)
               }
               index = targetEnd + 1
               continue
            }
         }

         var next = source.length
         var codeStart = source.indexOf('`', index + 1)
         var strongStart = source.indexOf('**', index + 1)
         var linkStart = source.indexOf('[', index + 1)
         if (codeStart !== -1) next = Math.min(next, codeStart)
         if (strongStart !== -1) next = Math.min(next, strongStart)
         if (linkStart !== -1) next = Math.min(next, linkStart)
         if (next === index) next++
         html += escapeHtml(source.slice(index, next))
         index = next
      }

      return html
   }

   function splitTableRow(line) {
      var value = String(line).trim()
      if (value[0] === '|') value = value.slice(1)
      if (value[value.length - 1] === '|') value = value.slice(0, -1)
      return value.split('|').map(function(cell) { return cell.trim() })
   }

   function tableAlignments(line) {
      var cells = splitTableRow(line)
      if (!cells.length || !cells.every(function(cell) { return /^:?-{3,}:?$/.test(cell) })) return null
      return cells.map(function(cell) {
         if (cell[0] === ':' && cell[cell.length - 1] === ':') return 'center'
         if (cell[cell.length - 1] === ':') return 'right'
         if (cell[0] === ':') return 'left'
         return ''
      })
   }

   function tableCell(tagName, value, alignment, options) {
      var className = alignment ? ' class="is-' + alignment + '"' : ''
      return '<' + tagName + className + '>' + renderInline(value, options) + '</' + tagName + '>'
   }

   function startsBlock(lines, index) {
      var line = lines[index] || ''
      if (/^\s*$/.test(line)) return true
      if (/^\s*```/.test(line)) return true
      if (/^#{1,6}\s+/.test(line)) return true
      if (/^\s*>\s?/.test(line)) return true
      if (/^\s*[-+*]\s+/.test(line)) return true
      if (/^\s*\d+\.\s+/.test(line)) return true
      return index + 1 < lines.length && !!tableAlignments(lines[index + 1]) && line.indexOf('|') !== -1
   }

   function renderMarkdown(value, options) {
      var lines = String(value == null ? '' : value).replace(/\r\n?/g, '\n').split('\n')
      var blocks = []
      var index = 0

      while (index < lines.length) {
         var line = lines[index]
         if (/^\s*$/.test(line)) {
            index++
            continue
         }

         var fence = line.match(/^\s*```\s*([A-Za-z0-9_-]*)\s*$/)
         if (fence) {
            var code = []
            index++
            while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
               code.push(lines[index])
               index++
            }
            if (index < lines.length) index++
            var language = fence[1] ? ' class="language-' + fence[1].toLowerCase() + '"' : ''
            blocks.push('<pre><code' + language + '>' + escapeHtml(code.join('\n')) + '</code></pre>')
            continue
         }

         var heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
         if (heading) {
            var level = heading[1].length
            blocks.push('<h' + level + '>' + renderInline(heading[2], options) + '</h' + level + '>')
            index++
            continue
         }

         var alignments = index + 1 < lines.length ? tableAlignments(lines[index + 1]) : null
         if (alignments && line.indexOf('|') !== -1) {
            var headers = splitTableRow(line)
            var rows = []
            index += 2
            while (index < lines.length && !/^\s*$/.test(lines[index]) && lines[index].indexOf('|') !== -1) {
               rows.push(splitTableRow(lines[index]))
               index++
            }
            var columnCount = Math.max(headers.length, alignments.length)
            var headHtml = ''
            for (var headIndex = 0; headIndex < columnCount; headIndex++) {
               headHtml += tableCell('th', headers[headIndex] || '', alignments[headIndex] || '', options)
            }
            var bodyHtml = rows.map(function(row) {
               var cells = ''
               for (var cellIndex = 0; cellIndex < columnCount; cellIndex++) {
                  cells += tableCell('td', row[cellIndex] || '', alignments[cellIndex] || '', options)
               }
               return '<tr>' + cells + '</tr>'
            }).join('')
            blocks.push('<div class="ne-markdown-table-wrap"><table><thead><tr>' + headHtml +
               '</tr></thead><tbody>' + bodyHtml + '</tbody></table></div>')
            continue
         }

         if (/^\s*>\s?/.test(line)) {
            var quote = []
            while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
               quote.push(lines[index].replace(/^\s*>\s?/, ''))
               index++
            }
            blocks.push('<blockquote><p>' + renderInline(quote.join(' '), options) + '</p></blockquote>')
            continue
         }

         var unordered = line.match(/^\s*[-+*]\s+(.+)$/)
         var ordered = line.match(/^\s*\d+\.\s+(.+)$/)
         if (unordered || ordered) {
            var listTag = ordered ? 'ol' : 'ul'
            var matcher = ordered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-+*]\s+(.+)$/
            var items = []
            var itemMatch
            while (index < lines.length && (itemMatch = lines[index].match(matcher))) {
               items.push('<li>' + renderInline(itemMatch[1], options) + '</li>')
               index++
            }
            blocks.push('<' + listTag + '>' + items.join('') + '</' + listTag + '>')
            continue
         }

         var paragraph = [line.trim()]
         index++
         while (index < lines.length && !startsBlock(lines, index)) {
            paragraph.push(lines[index].trim())
            index++
         }
         blocks.push('<p>' + renderInline(paragraph.join(' '), options) + '</p>')
      }

      return blocks.join('\n')
   }

   return {
      escapeHtml: escapeHtml,
      safeLinkTarget: safeLinkTarget,
      renderInline: renderInline,
      render: renderMarkdown,
   }
})
