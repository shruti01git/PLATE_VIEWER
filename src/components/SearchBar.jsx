import React, { useState } from 'react'

function Searchbar({ onSearch }) {
  const [input, setInput] = useState('')

  const handleSearchClick = () => {
    if (!input.trim()) return
    onSearch(input)
  }

  return (
    <div style={{ marginBottom: '10px' }}>
      <input
        type="text"
        placeholder="Enter vehicle number (e.g. AP16CU6672)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ padding: '6px', width: '250px' }}
      />

      <button
        onClick={handleSearchClick}
        style={{ marginLeft: '10px', padding: '6px 12px' }}
      >
        Search
      </button>
    </div>
  )
}

export default Searchbar
