import React, { useState } from 'react'
import '../styles/SearchBar.css'

function SearchBar({ onSearch }) {
  const [input, setInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearchClick = async () => {
    if (!input.trim()) return
    setIsSearching(true)
    try {
      onSearch(input)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick()
    }
  }

  const handleClear = () => {
    setInput('')
  }

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="🔍 Enter vehicle plate (e.g., AP16CU6672)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="search-input"
        />
        {input && (
          <button className="clear-btn" onClick={handleClear}>
            ✕
          </button>
        )}
      </div>

      <button
        onClick={handleSearchClick}
        disabled={!input.trim() || isSearching}
        className="search-btn"
      >
        {isSearching ? '⏳ Searching...' : '🔍 Search'}
      </button>
    </div>
  )
}

export default SearchBar
