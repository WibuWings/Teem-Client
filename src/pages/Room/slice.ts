import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { roomApi } from './apiSlice'
import { Message, Room, User } from './model'

const initialState: Room = {
  _id: '',
  code: '',
  host: undefined,
  messages: [],
  members: [],
}

export const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    pushNewUserToRoom: (state, { payload }: PayloadAction<User>) => {
      state.members = [...state.members, payload]
    },
    removeUserFromRoom: (state, { payload }: PayloadAction<string>) => {
      state.members = [...state.members].filter((member) => member.socketId !== payload)
    },
    pushMessage: (state, { payload }: PayloadAction<Message>) => {
      state.messages = [...state.messages, payload]
    },
    leaveRoom: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addMatcher(roomApi.endpoints.joinRoom.matchFulfilled, (state, { payload }) => {
      const { message, room } = payload
      return room
    })
  },
})

export const { pushMessage, pushNewUserToRoom, removeUserFromRoom, leaveRoom } = roomSlice.actions

export default roomSlice.reducer
