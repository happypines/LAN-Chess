import { useEffect, useRef, useState } from 'react'
import useSound from 'use-sound'

import { PeerManager } from './services/PeerManager'
import { webrtcService } from './services/WebRTCService'
import { gameEngine } from './services/GameEngine'

import { bb, bk, bn, bp, bq, br, wb, wk, wn, wp, wq, wr, move, check, capture, castle, gameOver } from './assets'

const icons = { bb, bk, bn, bp, bq, br, wb, wk, wn, wp, wq, wr }
const sounds = { move, check, capture, castle, gameOver }

function App() {
  const tableEnd = useRef(null)
  const peerManagerRef = useRef(null)
  let dragged = ""

  const soundboard = {
    move: useSound(sounds.move)[0],
    check: useSound(sounds.check)[0],
    capture: useSound(sounds.capture)[0],
    castle: useSound(sounds.castle)[0],
    gameOver: useSound(sounds.gameOver)[0]
  }

  // Game state
  const [board, setBoard] = useState(Array(8).fill([null, null, null, null, null, null, null, null]))
  const [availableMoves, setAvailableMoves] = useState([])
  const [selectedSquare, setSelectedSquare] = useState('')
  const [turn, setTurn] = useState('')
  const [isCheck, setIsCheck] = useState(false)
  const [isGameOver, setIsGameOver] = useState([false, {
    isCheckmate: false,
    isDraw: false,
    isStalemate: false
  }])
  const [history, setHistory] = useState([])
  const [color, setColor] = useState('')
  const [gameId, setGameId] = useState('')
  const [status, setStatus] = useState('lobby')
  const [isHost, setIsHost] = useState(false)
  const [peerConnected, setPeerConnected] = useState(false)
  const [showOfferPanel, setShowOfferPanel] = useState(false)
  const [offer, setOffer] = useState(null)
  const [answer, setAnswer] = useState(null)

  const getMoves = (square) => {
    if (!peerManagerRef.current) return
    if (turn === color?.[0]) {
      const moves = peerManagerRef.current.getMoves(square)
      const moveSquares = moves.map(m => m.to)
      setAvailableMoves(moveSquares)
    }
  }

  // Play sounds on history change
  useEffect(() => {
    if (history.length > 0) {
      const lastMove = history[history.length - 1]
      let moveType = 'move'
      if (lastMove.flags?.includes('c')) {
        moveType = 'capture'
      } else if (lastMove.flags?.includes('k') || lastMove.flags?.includes('q')) {
        moveType = 'castle'
      }
      if (soundboard[moveType]) {
        soundboard[moveType]()
      }
    }
    setSelectedSquare('')
    setAvailableMoves([])
  }, [history])

  const movePiece = (move) => {
    if (!peerManagerRef.current) return
    if (turn === color?.[0] && status === 'playing') {
      peerManagerRef.current.makeMove(move)
    }
  }
  const handleSquareClick = (e) => {
    let square = e.target.getAttribute('square')

    if (selectedSquare !== square) {
      if (availableMoves.includes(square)) {
        movePiece(`${selectedSquare}${square}`)
      } else {
        setSelectedSquare(square)
        getMoves(square)
      }
    } else {
      setSelectedSquare('')
      setAvailableMoves([])
    }
  }

  const handleDragStart = (e) => {
    dragged = e.target.getAttribute('square')
    let square = dragged
    if (selectedSquare !== square) {
      setSelectedSquare(square)
      getMoves(square)
    }
  }

  const handleDrop = (e) => {
    let square = e.target.getAttribute('square')
    if (availableMoves.includes(square)) {
      movePiece(`${selectedSquare}${square}`)
    }
  }

  // Create a new game (host)
  const createGame = async () => {
    const newGameId = document.getElementById('roomInput')?.value || Math.random().toString(36).substr(2, 9)
    document.getElementById('roomInput').value = newGameId

    const pm = new PeerManager(newGameId)
    await pm.createGame()
    peerManagerRef.current = pm
    
    setGameId(newGameId)
    setIsHost(true)
    setColor('white')
    setStatus('waiting-for-guest')
    setShowOfferPanel(true)

    // Setup callbacks
    pm.onGameStateChange = (state) => {
      setBoard(state.position)
      setTurn(state.turn)
      setIsCheck(state.isCheck)
      setIsGameOver([state.isGameOver, {
        isCheckmate: state.isCheckmate,
        isDraw: state.isDraw,
        isStalemate: state.isStalemate
      }])
      setHistory(state.history)
    }

    pm.onPeerConnected = () => {
      setPeerConnected(true)
      setStatus('playing')
    }

    pm.onPeerDisconnected = () => {
      setPeerConnected(false)
      setStatus('waiting-for-guest')
    }

    // Create WebRTC offer
    const offer = await pm.createOffer()
    setOffer(offer)
  }

  // Join a game (guest)
  const joinGame = async () => {
    const gameIdInput = document.getElementById('roomInput')?.value
    if (!gameIdInput) {
      alert('Please enter a game ID')
      return
    }

    const pm = new PeerManager(gameIdInput)
    await pm.joinGame()
    peerManagerRef.current = pm
    
    setGameId(gameIdInput)
    setIsHost(false)
    setColor('black')
    setStatus('waiting-for-offer')

    // Setup callbacks
    pm.onGameStateChange = (state) => {
      setBoard(state.position)
      setTurn(state.turn)
      setIsCheck(state.isCheck)
      setIsGameOver([state.isGameOver, {
        isCheckmate: state.isCheckmate,
        isDraw: state.isDraw,
        isStalemate: state.isStalemate
      }])
      setHistory(state.history)
    }

    pm.onPeerConnected = () => {
      setPeerConnected(true)
      setStatus('playing')
    }

    pm.onPeerDisconnected = () => {
      setPeerConnected(false)
      setStatus('waiting-for-host')
    }
  }

  // Handle offer from host (guest receives)
  const handleReceiveOffer = async (offerText) => {
    if (!peerManagerRef.current) {
      alert('Please join a game first')
      return
    }

    try {
      const offerObj = JSON.parse(offerText)
      const answer = await peerManagerRef.current.handleOffer(offerObj)
      setAnswer(answer)
      setStatus('waiting-for-answer-confirmation')
    } catch (e) {
      alert('Invalid offer: ' + e.message)
    }
  }

  // Handle answer from guest (host receives)
  const handleReceiveAnswer = async (answerText) => {
    if (!peerManagerRef.current) {
      alert('Please create a game first')
      return
    }

    try {
      const answerObj = JSON.parse(answerText)
      await peerManagerRef.current.handleAnswer(answerObj)
      setStatus('waiting-for-connection')
    } catch (e) {
      alert('Invalid answer: ' + e.message)
    }
  }

  const leaveRoom = () => {
    if (peerManagerRef.current) {
      peerManagerRef.current.disconnect()
    }
    webrtcService.closeAll()
    
    setGameId('')
    setIsHost(false)
    setStatus('lobby')
    setColor('')
    setPeerConnected(false)
    setShowOfferPanel(false)
    setOffer(null)
    setAnswer(null)
    setBoard(Array(8).fill([null, null, null, null, null, null, null, null]))
    setAvailableMoves([])
    setSelectedSquare('')
    setTurn('')
    setIsCheck(false)
    setIsGameOver([false, { isCheckmate: false, isDraw: false, isStalemate: false }])
    setHistory([])
  }

  const resetGame = () => {
    if (peerManagerRef.current) {
      peerManagerRef.current.resetGame()
    }
  }

  const undoMove = () => {
    if (peerManagerRef.current) {
      peerManagerRef.current.undoMove()
    }
  }

  return (
    <div className='absolute flex flex-wrap gap-3 items-center justify-center h-full w-full select-none'>
      <div className='hidden absolute text-white top-0 left-0 text-xs'>
        status: {status}<br />
        color: {color}<br />
        gameId: {gameId}<br />
        isHost: {isHost ? 'yes' : 'no'}<br />
        connected: {peerConnected ? 'yes' : 'no'}<br />
        turn: {turn}
      </div>
      {chessBoard({
        board: board,
        handleSquareClick: handleSquareClick,
        handleDragStart: handleDragStart,
        handleDrop: handleDrop,
        availableMoves: availableMoves,
        history: history,
        isCheck: isCheck,
        isGameOver: isGameOver,
        turn: turn,
        selectedSquare: selectedSquare,
        color: color
      })}
      {panel({
        history: history,
        tableEnd: tableEnd,
        status: status,
        color: color,
        gameId: gameId,
        isHost: isHost,
        peerConnected: peerConnected,
        showOfferPanel: showOfferPanel,
        offer: offer,
        answer: answer,
        createGame: createGame,
        joinGame: joinGame,
        handleReceiveOffer: handleReceiveOffer,
        handleReceiveAnswer: handleReceiveAnswer,
        leaveRoom: leaveRoom,
        resetGame: resetGame,
        undoMove: undoMove
      })}
    </div>
  )
}

function chessBoard({ board, handleSquareClick, handleDragStart, handleDrop, availableMoves, history, isCheck, isGameOver, turn, selectedSquare, color }) {
  let numToLetter = ["a", "b", "c", "d", "e", "f", "g", "h"]
  let boardArr = []

  for (let i = 0; i < board.length; i++) {
    let boardInd = (color === 'white' ? i : 7 - i)
    let row = board[boardInd]

    for (let j = 0; j < board.length; j++) {
      let rowInd = (color === 'white' ? j : 7 - j)
      let square = row[rowInd]

      let bgColor = (rowInd + boardInd) % 2 === 1 ? 'bg-[#739552]' : 'bg-[#EBECD0]'
      let textColor = (rowInd + boardInd) % 2 === 0 ? 'text-[#739552]' : 'text-[#EBECD0]'
      let coord = `${numToLetter[rowInd]}${8 - boardInd}`
      boardArr.push(
        <div
          key={coord}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault() }}
          className={`relative square flex flex-col ${bgColor} ${textColor}`}
          square={coord}
          onClick={handleSquareClick}
        >
          {rowInd === (color === 'white' ? 0 : 7) && <div square={coord} className='absolute text-xs font-semibold left-[3%]'>{8 - boardInd}</div>}
          {boardInd === (color === 'white' ? 7 : 0) && <div square={coord} className='absolute text-xs font-semibold self-end right-[5%] top-[69%]'>{numToLetter[rowInd]}</div>}
          {square != null ?
            <img
              src={icons[`${square.color}${square.type}`]}
              square={coord}
              className='m-auto z-20 h-[90%] w-[90%]'
              onDragStart={handleDragStart}
              draggable="true"
              alt={`${square.color}-${square.type}`}
            /> : ""
          }
          {squareUnderlay({ square: square, coord: coord, history: history, availableMoves: availableMoves, isCheck: isCheck, turn: turn, selectedSquare: selectedSquare })}
        </div>
      )
    }
  }

  return (
    <div id="board" className='relative grid-rows-8 grid-cols-8 grid grabbable text-black h-[500px] w-[500px]'>
      {boardArr}
      {isGameOver[0] && <div className='absolute bg-zinc-800 bg-opacity-80 h-full w-full flex items-center justify-center z-40'>
        <div className='font-light text-white text-center text-4xl'>
          Game Over: <br />
          {isGameOver[1].isCheckmate ? 'Checkmate' : isGameOver[1].isDraw ? 'Draw' : isGameOver[1].isStalemate ? 'Stalemate' : ''}
        </div>
      </div>}
    </div>
  )
}

function squareUnderlay({ square, coord, history, availableMoves, isCheck, turn, selectedSquare }) {
  let availableMove = null
  let bg = ''
  
  if (availableMoves.includes(coord)) {
    if (square != null) {
      availableMove = <div style={{
        border: '4px solid black',
        borderRadius: '50%',
        height: '100%',
        width: '100%',
        opacity: '0.2'
      }}
        square={coord}
      />
    } else {
      availableMove = <div square={coord} className='rounded-full bg-black bg-opacity-20 h-[40%] w-[40%]' />
    }
  }

  if (history.length > 0) {
    let lastMove = history[history.length - 1]
    if (coord === lastMove.from || coord === lastMove.to) {
      bg = 'bg-yellow-300 bg-opacity-65'
    }
  }

  if (selectedSquare === coord && square != null) {
    bg = 'bg-yellow-300 bg-opacity-65'
  }

  if (square != null && square.type === 'k' && isCheck && square.color === turn) {
    bg = 'bg-red-600 bg-opacity-70'
  }

  return (
    <div square={coord} className={`absolute ${bg} z-10 w-full h-full flex items-center justify-center`}>
      {availableMove}
    </div>
  )
}

function controlPanel({ history, tableEnd, status, color, gameId, isHost, peerConnected, resetGame, undoMove, leaveRoom }) {
  return (
    <div className='h-[500px] gap-3 w-96 bg-zinc-700 bg-opacity-90 rounded-xl p-3 flex flex-col'>
      <div>
        <p className='font-semibold text-green-400'>Opponent {peerConnected ? '✓ Connected' : '⏳ Waiting'}</p>
      </div>
      <div className='flex flex-col gap-3 grow justify-center'>
        <div ref={tableEnd} className='h-40 overflow-auto bg-zinc-900 bg-opacity-35 rounded-xl p-2 select-text'>
          <table className='w-3/5 table-auto'>
            {history.map((move, i) => {
              if (i % 2 === 0) {
                return (
                  <tr key={i} className='text-center font-semibold text-sm'>
                    <td className='font-normal text-gray-400'>{i / 2 + 1}.</td>
                    <td>{move.san}</td>
                    <td>{history[i + 1]?.san}</td>
                  </tr>
                )
              } else {
                return null
              }
            })}
          </table>
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <button className='bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded' onClick={undoMove}>
            Undo
          </button>
          <button className='bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded' onClick={resetGame}>
            Reset Game
          </button>
        </div>
        <button className='bg-red-600 hover:bg-red-700 px-2 py-1 rounded' onClick={leaveRoom}>
          Leave
        </button>
        <div className='text-xs text-gray-300'>
          <p>Room: <em className='text-emerald-400'>{gameId}</em></p>
          <p>{isHost ? '👑 You are the host' : '🎮 Joined game'}</p>
        </div>
      </div>
      <div>
        <p className='text-sm'>You: {color}</p>
      </div>
    </div>
  )
}

function gameJoinPanel({ showOfferPanel, offer, answer, createGame, joinGame, handleReceiveOffer, handleReceiveAnswer, status }) {
  const [offerInput, setOfferInput] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [guestOfferInput, setGuestOfferInput] = useState('')

  if (showOfferPanel) {
    return (
      <div className='h-[500px] gap-3 w-96 bg-zinc-700 bg-opacity-90 rounded-xl p-3 flex flex-col overflow-auto'>
        <div>
          <p className='text-center text-white text-2xl font-bold'>♟ P2P Chess</p>
          <p className='text-center text-gray-400 text-xs'>LAN Multiplayer via WebRTC</p>
        </div>

        {offer && (
          <div>
            <p className='font-semibold text-green-400'>✓ Room Created!</p>
            <p className='text-xs text-gray-400 mt-2'>Share this with guest:</p>
            <textarea
              className='w-full h-24 p-2 rounded text-xs font-mono bg-zinc-800 text-green-300 mt-1'
              value={JSON.stringify(offer, null, 2)}
              readOnly
            />
            <button
              className='w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm mt-2'
              onClick={() => navigator.clipboard.writeText(JSON.stringify(offer))}
            >
              📋 Copy Offer
            </button>

            <div className='border-t border-gray-500 my-3'></div>

            <p className='text-xs text-gray-400'>Waiting for guest answer...</p>
            <input
              className='w-full py-1 px-2 rounded text-xs font-mono bg-zinc-800 mt-1'
              type='textarea'
              placeholder='Paste guest answer here...'
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
            />
            <button
              className='w-full bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-sm mt-1'
              onClick={() => {
                if (answerInput) {
                  handleReceiveAnswer(answerInput)
                }
              }}
            >
              ✓ Connect Guest
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='h-[500px] gap-3 w-96 bg-zinc-700 bg-opacity-90 rounded-xl p-3 flex flex-col overflow-auto'>
      <div>
        <p className='text-center text-white text-2xl font-bold'>♟ P2P Chess</p>
        <p className='text-center text-gray-400 text-xs'>LAN Multiplayer via WebRTC</p>
      </div>

      <div className='flex flex-col gap-2 text-sm'>
        <div className='flex gap-2'>
          <input
            required
            id="roomInput"
            className='grow py-1 px-2 rounded-lg text-black'
            type='text'
            placeholder='Room code (auto-generated)'
          />
        </div>
        <button
          className='w-full bg-green-600 hover:bg-green-700 px-2 py-2 rounded font-semibold'
          onClick={createGame}
        >
          📡 Create Room
        </button>
      </div>

      <div className='border-t border-gray-500 my-2'></div>

      <div className='flex flex-col gap-2 text-sm'>
        <p className='font-semibold text-gray-300'>Join Room</p>
        <input
          id="roomInput2"
          className='grow py-1 px-2 rounded-lg text-black text-xs font-mono'
          type='textarea'
          placeholder='Enter room code...'
          onChange={(e) => {
            document.getElementById('roomInput').value = e.target.value
          }}
        />
        <button
          className='w-full bg-blue-600 hover:bg-blue-700 px-2 py-2 rounded font-semibold'
          onClick={joinGame}
        >
          🔗 Join Room
        </button>

        {status === 'waiting-for-offer' && (
          <div>
            <p className='text-xs text-gray-400 mb-1'>Paste host offer here:</p>
            <textarea
              className='w-full h-20 p-1 rounded text-xs font-mono bg-zinc-800'
              placeholder='Paste offer from host...'
              value={guestOfferInput}
              onChange={(e) => setGuestOfferInput(e.target.value)}
            />
            <button
              className='w-full bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-sm mt-1'
              onClick={() => handleReceiveOffer(guestOfferInput)}
            >
              📨 Process Offer
            </button>
          </div>
        )}

        {answer && (
          <div>
            <p className='text-xs text-gray-400 mb-1'>Send this to host:</p>
            <textarea
              className='w-full h-20 p-1 rounded text-xs font-mono bg-zinc-800'
              value={JSON.stringify(answer, null, 2)}
              readOnly
            />
            <button
              className='w-full bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-sm mt-1'
              onClick={() => navigator.clipboard.writeText(JSON.stringify(answer))}
            >
              📋 Copy Answer
            </button>
          </div>
        )}
      </div>

      <div className='text-xs text-gray-500 mt-auto'>
        <p className='font-semibold'>How it works:</p>
        <ul className='list-disc list-inside space-y-1'>
          <li>Host creates room, copies offer</li>
          <li>Guest pastes offer, gets answer</li>
          <li>Host pastes answer to connect</li>
          <li>Direct P2P connection! 🚀</li>
        </ul>
      </div>
    </div>
  )
}

function panel({ history, tableEnd, status, color, gameId, isHost, peerConnected, showOfferPanel, offer, answer, createGame, joinGame, handleReceiveOffer, handleReceiveAnswer, leaveRoom, resetGame, undoMove }) {
  if (status === 'lobby' || status === 'waiting-for-offer') {
    return gameJoinPanel({ showOfferPanel, offer, answer, createGame, joinGame, handleReceiveOffer, handleReceiveAnswer, status })
  } else {
    return controlPanel({ history, tableEnd, status, color, gameId, isHost, peerConnected, resetGame, undoMove, leaveRoom })
  }
}

export default App
