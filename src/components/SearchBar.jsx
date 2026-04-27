import React, { useState } from 'react'

function Searchbar({ onSearch }) {
  const [input, setInput] = useState('')

  return (
    <div>
      <input
        type="text"
        placeholder="Enter plate number"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={() => onSearch(input)}>Search</button>
    </div>
  )
}

export default Searchbar
