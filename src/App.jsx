import { useState } from 'react'
import mammoth from 'mammoth'
import './App.css'

function App() {
  const [docContent, setDocContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')

  const handleDownload = () => {
    // HTML içeriğini Blob olarak oluştur
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Döküman</title>
          <style>
            body { font-family: Arial, sans-serif; }
            p { margin: 1rem 0; }
            strong { font-weight: bold; }
          </style>
        </head>
        <body>
          ${docContent}
        </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html' })
    
    // Dosyayı indir
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(blob)
    downloadLink.download = 'dokuman.html'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const handleCopy = () => {
    const type = 'text/html';
    const blob = new Blob([docContent], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    
    navigator.clipboard.write(data)
      .then(() => {
        setCopyStatus('Kopyalandı!')
        setTimeout(() => setCopyStatus(''), 2000)
      })
      .catch(() => {
        // Eğer HTML formatında kopyalama başarısız olursa düz metin olarak dene
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = docContent
        navigator.clipboard.writeText(tempDiv.textContent)
          .then(() => {
            setCopyStatus('Kopyalandı! (düz metin)')
            setTimeout(() => setCopyStatus(''), 2000)
          })
          .catch(() => {
            setCopyStatus('Kopyalama başarısız')
            setTimeout(() => setCopyStatus(''), 2000)
          })
      })
  }

  const processContent = (htmlContent) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent

    const processedParagraphs = []
    const textContent = tempDiv.textContent
    const boldRegex = /<(strong|b)>(.*?)<\/(strong|b)>/g
    let lastIndex = 0
    let match

    while ((match = boldRegex.exec(htmlContent)) !== null) {
      const boldText = match[2]
      const startIndex = htmlContent.indexOf(match[0], lastIndex)
      const nextBoldIndex = htmlContent.indexOf('<strong>', startIndex + match[0].length)
      const endIndex = nextBoldIndex !== -1 ? nextBoldIndex : htmlContent.length

      let paragraph = htmlContent.slice(startIndex, endIndex)
      processedParagraphs.push(`<p>${paragraph}</p>`)
      lastIndex = endIndex
    }

    return processedParagraphs.join('')
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.docx')) {
      setError('Lütfen sadece .docx dosyası yükleyin')
      return
    }

    setLoading(true)
    setError(null)
    setCopyStatus('')
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const options = {
        styleMap: [
          "p[style-name='Normal'] => p:fresh",
          "b => strong:fresh"
        ],
        transformDocument: (document) => {
          return document;
        }
      }
      const result = await mammoth.convertToHtml({ arrayBuffer }, options)
      const processedContent = processContent(result.value)
      setDocContent(processedContent)
    } catch (err) {
      setError('Dosya okuma hatası: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="title-section">
        <h1>Word Dosya Düzenleyici</h1>
        <span className="version-badge">v0.0.3</span>
      </div>
      
      <div className="upload-section">
        <label htmlFor="docx-file" className="file-input-label">
          Dosya Seçin
          <input
            type="file"
            id="docx-file"
            accept=".docx"
            onChange={handleFileChange}
            className="file-input"
          />
        </label>
      </div>

      {loading && <div className="loading">Dosya yükleniyor...</div>}
      {error && <div className="error">{error}</div>}
      
      {docContent && (
        <div className="content-section">
          <div className="content-header">
            <h2>Dosya İçeriği:</h2>
            <div className="button-group">
              <button onClick={handleCopy} className="copy-button">
                {copyStatus || 'Kopyala'}
              </button>
              <button onClick={handleDownload} className="download-button">
                HTML İndir
              </button>
            </div>
          </div>
          <div 
            className="doc-content"
            dangerouslySetInnerHTML={{ __html: docContent }}
          />
        </div>
      )}
    </div>
  )
}

export default App
