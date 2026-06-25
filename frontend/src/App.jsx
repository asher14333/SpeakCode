import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const problem = {
  title: 'Two Sum',
  description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
}

const API_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [transcript, setTranscript] = useState('')
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
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setFeedback(null)

    try {
      const { data } = await axios.post(`${API_URL}/analyze`, { transcript })
      setFeedback(data)
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
      <header className="header">
        <h1>CodeSpeak</h1>
        <p className="tagline">AI Interview Communication Coach</p>
      </header>

      <main className="main">
        <section className="card problem-card">
          <h2>Problem: {problem.title}</h2>
          <p className="problem-description">{problem.description}</p>
          <p className="hint">
            Explain your solution as if you are in a technical interview.
          </p>
        </section>

        <section className="card recording-card">
          <div className="recording-controls">
            {!isRecording ? (
              <button
                className="btn btn-record"
                onClick={startRecording}
                disabled={!speechSupported}
              >
                🎤 Start Explanation
              </button>
            ) : (
              <button className="btn btn-stop" onClick={stopRecording}>
                ⏹ Stop Recording
              </button>
            )}
            {isRecording && (
              <span className="recording-indicator">
                <span className="pulse" />
                Recording...
              </span>
            )}
          </div>

          {!speechSupported && (
            <p className="warning">
              Speech recognition is not supported in this browser. Type your
              explanation below instead.
            </p>
          )}

          <label htmlFor="transcript" className="transcript-label">
            Your Explanation:
          </label>
          <textarea
            id="transcript"
            className="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Click Start Explanation and speak, or type your approach here..."
            rows={6}
          />

          <button
            className="btn btn-analyze"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !transcript.trim()}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </section>

        {error && (
          <section className="card error-card">
            <p>{error}</p>
          </section>
        )}

        {feedback && (
          <section className="card feedback-card">
            <h2>AI Interview Feedback</h2>
            <div className={`verdict ${feedback.passed ? 'verdict-pass' : 'verdict-fail'}`}>
              {feedback.passed ? '✓ You passed!' : 'Keep practicing'}
            </div>
            <div className="score">
              Score: <strong>{feedback.score}/10</strong>
            </div>

            {feedback.strengths?.length > 0 && (
              <div className="feedback-section">
                <h3>Strengths</h3>
                <ul className="strengths">
                  {feedback.strengths.map((item, i) => (
                    <li key={i}>✓ {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.improvements?.length > 0 && (
              <div className="feedback-section">
                <h3>Improvements</h3>
                <ul className="improvements">
                  {feedback.improvements.map((item, i) => (
                    <li key={i}>− {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
