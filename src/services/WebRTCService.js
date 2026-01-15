/**
 * WebRTCService - Peer-to-peer communication using WebRTC
 * Enables two browsers to connect and sync game state
 */

export class WebRTCService {
  constructor() {
    this.peerConnections = new Map() // { peerId: RTCPeerConnection }
    this.dataChannels = new Map() // { peerId: RTCDataChannel }
    this.localStream = null
    this.config = {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
        { urls: ['stun:stun2.l.google.com:19302'] }
      ]
    }
    this.messageCallbacks = new Map()
    this.connectionCallbacks = new Map()
  }

  /**
   * Create a new peer connection
   */
  createPeerConnection(peerId) {
    const peerConnection = new RTCPeerConnection({ iceServers: this.config.iceServers })

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const callback = this.connectionCallbacks.get(`ice-${peerId}`)
        if (callback) {
          callback(event.candidate)
        }
      }
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, peerConnection.connectionState)
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        this.removePeer(peerId)
      }
    }

    // Handle incoming data channels
    peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(peerId, event.channel)
    }

    this.peerConnections.set(peerId, peerConnection)
    return peerConnection
  }

  /**
   * Create a data channel
   */
  createDataChannel(peerId, label = 'game-data') {
    const peerConnection = this.peerConnections.get(peerId)
    if (!peerConnection) return null

    const dataChannel = peerConnection.createDataChannel(label, {
      ordered: true // Messages delivered in order
    })

    this.setupDataChannel(peerId, dataChannel)
    return dataChannel
  }

  /**
   * Setup data channel event handlers
   */
  setupDataChannel(peerId, dataChannel) {
    dataChannel.onopen = () => {
      console.log(`Data channel with ${peerId} opened`)
      this.dataChannels.set(peerId, dataChannel)
      const callback = this.connectionCallbacks.get(`open-${peerId}`)
      if (callback) callback()
    }

    dataChannel.onclose = () => {
      console.log(`Data channel with ${peerId} closed`)
      this.dataChannels.delete(peerId)
      const callback = this.connectionCallbacks.get(`close-${peerId}`)
      if (callback) callback()
    }

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with ${peerId}:`, error)
    }

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const callback = this.messageCallbacks.get(peerId)
        if (callback) callback(message)
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    }
  }

  /**
   * Create offer (initiator)
   */
  async createOffer(peerId) {
    const peerConnection = this.peerConnections.get(peerId) || this.createPeerConnection(peerId)

    try {
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      return offer
    } catch (e) {
      console.error('Failed to create offer:', e)
      return null
    }
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(peerId, offer) {
    const peerConnection = this.peerConnections.get(peerId) || this.createPeerConnection(peerId)

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      return answer
    } catch (e) {
      console.error('Failed to handle offer:', e)
      return null
    }
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(peerId, answer) {
    const peerConnection = this.peerConnections.get(peerId)
    if (!peerConnection) return false

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      return true
    } catch (e) {
      console.error('Failed to handle answer:', e)
      return false
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(peerId, candidate) {
    const peerConnection = this.peerConnections.get(peerId)
    if (!peerConnection) return false

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      return true
    } catch (e) {
      console.error('Failed to add ICE candidate:', e)
      return false
    }
  }

  /**
   * Send message to peer
   */
  sendMessage(peerId, data) {
    const dataChannel = this.dataChannels.get(peerId)
    if (!dataChannel || dataChannel.readyState !== 'open') {
      console.warn(`Cannot send to ${peerId}: data channel not ready`)
      return false
    }

    try {
      dataChannel.send(JSON.stringify(data))
      return true
    } catch (e) {
      console.error('Failed to send message:', e)
      return false
    }
  }

  /**
   * Register message callback
   */
  onMessage(peerId, callback) {
    this.messageCallbacks.set(peerId, callback)
    return () => this.messageCallbacks.delete(peerId)
  }

  /**
   * Register connection callback
   */
  onConnectionEvent(peerId, event, callback) {
    this.connectionCallbacks.set(`${event}-${peerId}`, callback)
    return () => this.connectionCallbacks.delete(`${event}-${peerId}`)
  }

  /**
   * Remove peer connection
   */
  removePeer(peerId) {
    const dataChannel = this.dataChannels.get(peerId)
    if (dataChannel) {
      dataChannel.close()
      this.dataChannels.delete(peerId)
    }

    const peerConnection = this.peerConnections.get(peerId)
    if (peerConnection) {
      peerConnection.close()
      this.peerConnections.delete(peerId)
    }
  }

  /**
   * Close all connections
   */
  closeAll() {
    for (const peerId of this.peerConnections.keys()) {
      this.removePeer(peerId)
    }
  }

  /**
   * Check if connected to peer
   */
  isConnected(peerId) {
    const dataChannel = this.dataChannels.get(peerId)
    return dataChannel && dataChannel.readyState === 'open'
  }
}

export const webrtcService = new WebRTCService()
