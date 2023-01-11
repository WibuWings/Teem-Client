export type JoinRoomDTO = {
  roomCode: string
  username: string
  socketId: string
}

export type User = {
  _id: string
  username: string
  socketId: string
}

export type Message = {
  sender: User
  content: string
}

export type Room = {
  _id: string
  code: string
  host?: User
  members: User[]
  messages: Message[]
}
