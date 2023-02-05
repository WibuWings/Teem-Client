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

export enum MessageType {
  Text = 'text',
  File = 'file',
}
export type Message = {
  sender: User
  content: string
  typeMessage: MessageType
}

export type Room = {
  _id: string
  code: string
  host?: User
  members: User[]
  messages: Message[]
}
