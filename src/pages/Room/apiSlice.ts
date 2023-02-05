import { apiSlice } from '@/pages/api'
import { HTTP_METHOD } from '@/services/axiosHelper'
import { JoinRoomDTO, Room } from './model'

export const roomApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    joinRoom: builder.mutation<{ room: Room; message: string }, JoinRoomDTO>({
      query: (joinRoomDTO) => {
        return {
          url: '/join-room',
          method: HTTP_METHOD.POST,
          data: joinRoomDTO,
        }
      },
    }),
    getRoom: builder.query<{ room: Room; message: string }, string>({
      query: (roomCode) => {
        return {
          url: `/room/${roomCode}`,
          method: HTTP_METHOD.GET,
        }
      },
    }),
    uploadFile: builder.mutation<{ data: {fileName: string, url: string}; message: string }, FormData>({
      query: (formData) => {
        return {
          url: `/upload`,
          method: HTTP_METHOD.POST,
          data: formData
        }
      },
    }),
  }),
  overrideExisting: false,
})

export const { useJoinRoomMutation, useLazyGetRoomQuery, useUploadFileMutation } = roomApi
