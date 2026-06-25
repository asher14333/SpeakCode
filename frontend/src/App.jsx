import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { problem } from './data/twoSum'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [code, setCode] = useState(problem.starterCode)
  const [transcript, setTranscript] = useState('')
  const [activeTab, setActiveTab] = useState('code')
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef(null)
  const sessionBaseRef = useRef('')

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let sessionText = ''
      for (let i = 0; i < event.results.length; i++) {
        sessionText += event.results[i][0].transcript
      }
      setTranscript((sessionBaseRef.current + sessionText).trim())
    }

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`)
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
  }, [])

  const startRecording = () => {
    setError(null)
    setFeedback(null)
    setActiveTab('explain')
    sessionBaseRef.current = transcript ? `${transcript} ` : ''
    try {
      recognitionRef.current?.start()
      setIsRecording(true)
    } catch {
      setError('Could not start recording. Try again.')
    }
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError('Please record or type your explanation first.')
      setActiveTab('explain')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setFeedback(null)

    try {
      const { data } = await axios.post(`${API_URL}/analyze`, {
        transcript,
        code,
      })
      setFeedback(data)
      setActiveTab('feedback')
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        'Failed to analyze. Make sure the backend is running.'
      setError(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo">CodeSpeak</span>
          <span className="topbar-divider" />
          <span className="problem-nav">
            {problem.id}. {problem.title}
          </span>
        </div>
        <button
          className="btn-analyze-top"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !transcript.trim()}
        >
          {isAnalyzing ? 'Analyzing…' : 'Analyze Interview'}
        </button>
      </header>

      <div className="workspace">
        <aside className="problem-panel">
          <div className="problem-header">
            <h1>{problem.title}</h1>
            <div className="problem-meta">
              <span className={`difficulty difficulty-${problem.difficulty.toLowerCase()}`}>
                {problem.difficulty}
              </span>
              {problem.topics.map((topic) => (
                <span key={topic} className="topic-tag">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="problem-body">
            <p className="problem-text">{problem.description}</p>
            {problem.details.map((line, i) => (
              <p key={i} className="problem-text">
                {line}
              </p>
            ))}

            {problem.examples.map((ex, i) => (
              <div key={i} className="example-block">
                <p className="example-title">Example {i + 1}:</p>
                <pre className="example-code">
                  <strong>Input:</strong> {ex.input}
                  {'\n'}
                  <strong>Output:</strong> {ex.output}
                  {ex.explanation && (
                    <>
                      {'\n'}
                      <strong>Explanation:</strong> {ex.explanation}
                    </>
                  )}
                </pre>
              </div>
            ))}

            <div className="constraints-block">
              <p className="section-title">Constraints:</p>
              <ul>
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <main className="editor-panel">
          <div className="panel-tabs">
            <button
              className={`tab ${activeTab === 'code' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              Code
            </button>
            <button
              className={`tab ${activeTab === 'explain' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('explain')}
            >
              Explanation
              {isRecording && <span className="tab-recording-dot" />}
            </button>
            {feedback && (
              <button
                className={`tab ${activeTab === 'feedback' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('feedback')}
              >
                Feedback
              </button>
            )}
          </div>

          <div className="panel-content">
            {activeTab === 'code' && (
              <div className="code-pane">
                <div className="code-toolbar">
                  <span className="lang-label">Python3</span>
                  <button
                    className="btn-text"
                    onClick={() => setCode(problem.starterCode)}
                  >
                    Reset
                  </button>
                </div>
                <textarea
                  className="code-editor"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}

            {activeTab === 'explain' && (
              <div className="explain-pane">
                <div className="explain-toolbar">
                  {!isRecording ? (
                    <button
                      className="btn-record"
                      onClick={startRecording}
                      disabled={!speechSupported}
                    >
                      <MicIcon />
                      Start Explanation
                    </button>
                  ) : (
                    <button className="btn-stop" onClick={stopRecording}>
                      <StopIcon />
                      Stop Recording
                    </button>
                  )}
                  {isRecording && (
                    <span className="recording-badge">
                      <span className="pulse" />
                      Listening…
                    </span>
                  )}
                </div>

                {!speechSupported && (
                  <p className="warning">
                    Speech recognition isn&apos;t supported in this browser. Type
                    your explanation below.
                  </p>
                )}

                <p className="explain-hint">
                  Walk through your approach out loud — brute force, optimization,
                  complexity, and how your code works.
                </p>

                <textarea
                  className="transcript-editor"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Click Start Explanation and speak, or type your approach here…"
                />
              </div>
            )}

            {activeTab === 'feedback' && feedback && (
              <div className="feedback-pane">
                <div
                  className={`verdict ${feedback.passed ? 'verdict-pass' : 'verdict-fail'}`}
                >
                  {feedback.passed ? '✓ You passed!' : 'Keep practicing'}
                </div>

                <div className="score-row">
                  <span className="score-label">Communication Score</span>
                  <span className="score-value">{feedback.score}/10</span>
                </div>

                {feedback.strengths?.length > 0 && (
                  <div className="feedback-block">
                    <h3>Strengths</h3>
                    <ul className="strengths">
                      {feedback.strengths.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {feedback.improvements?.length > 0 && (
                  <div className="feedback-block">
                    <h3>Improvements</h3>
                    <ul className="improvements">
                      {feedback.improvements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  )
}

export default App
