import {
  Button,
  Layout,
  message,
  Modal,
  notification,
  Space,
  Spin,
} from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as Icon from '@ant-design/icons'

import { PrepairRoom } from './components/PrepairRoom'

import styles from './style.module.less'
import { rc, RouteKey } from '@/routes'
import { UserGrid } from './components/UserGrid/UserGrid'
import { IncallMessage } from './components/IncallMessage'
import { UserFrame } from './components/UserFrame'
import { Overlay } from './components/Overlay'
import { useAppDispatch, useAppSelector, usePeerContext, useSocketContext } from '@/hooks'
import { leaveRoom, pushNewUserToRoom, removeUserFromRoom } from './slice'
import { SOCKET_EVENT } from '@/providers/Socket'
import { roomApi, useJoinRoomMutation, useLazyGetRoomQuery } from './apiSlice'
import { JoinRoomDTO, User, Room } from './model'
import { waitApi } from '@/utils/async'
import { io, Socket } from 'socket.io-client'
import { API_URL } from '@/config'
import { trackForMutations } from '@reduxjs/toolkit/dist/immutableStateInvariantMiddleware'
import { getResourceUrl } from '@/transforms/url'
import { PAGE_INFO } from '@/constants/page'
import { Participant } from './components/Participant'
import { PeerConnectOption } from 'peerjs'


const pc_config = {
	iceServers: [
		// {
		//   urls: 'stun:[STUN_IP]:[PORT]',
		//   'credentials': '[YOR CREDENTIALS]',
		//   'username': '[USERNAME]'
		// },
		{
			urls: 'stun:stun.l.google.com:19302',
		},
	],
};

type WebRTCUser = {
  socketId: string
  username: string
  remoteStream?: MediaStream
}


export function RoomPage() {
  // react hook
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  // socket & peer
  const { socket } = useSocketContext() //socket of current user

  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()  //local video

  const screenStreamRef = useRef<MediaStream | undefined>() //local stream

  const screenSocketRef = useRef<Socket<any, any> | undefined>() //local share screen socket

  const peerInstanceList = useRef<{ [socketId: string]: RTCPeerConnection }>({}) // list peerConnection with orther members

  const [streamList, setStreamList] = useState<WebRTCUser[]>([]) // list user in room

  // room API
  const [joinRoom, { isLoading: isLoadingJoinRoom, error: errorJoinRoom }] = useJoinRoomMutation()
  const [trigger] = useLazyGetRoomQuery()
  // state
  const roomInfo = useAppSelector((state) => state.room)
  const [isInLobby, setIsInLobby] = useState(true)
  const [isCollapsedMessage, setIsCollapsedMessage] = useState(true)
  const [isCollapsedParticipant, setIsCollapsedParticipant] = useState(true)
  const [isOpenMic, setIsOpenMic] = useState(false)
  const [isOpenCamera, setIsOpenCamera] = useState(false)
  const [isShareScreen, setIsShareScreen] = useState(false)
  const [pinUser, setPinUser] = useState<User | undefined>()
  useEffect(() => {
    if (roomInfo) {
      if (!roomInfo.members.find((m) => m.socketId === pinUser?.socketId)) {
        setPinUser(undefined)
      }
    }
  }, [roomInfo])
  const createPeerConnection = (
    ortherSocketId: string,
    name: string
  ) => {
    try{
      const pc = new RTCPeerConnection(pc_config)
      pc.onicecandidate = (e) =>{
        if (!(socket && e.candidate)) return;
        console.log('onicecandidate');
        socket.emit('candidate', {
					candidate: e.candidate,
					candidateSendID: socket.id,
					candidateReceiveID: ortherSocketId,
				});
      }
      pc.oniceconnectionstatechange = (e) => {
				console.log(e);
			};
      pc.ontrack = (e) => {
				console.log('ontrack success');
        setStreamList( (oldList) =>
                oldList
                  .filter((p) => p.socketId !== ortherSocketId)
                  .concat({
                    socketId: ortherSocketId,
                    username: name,
                    remoteStream: e.streams[0],
                  })
              )
			};
      if (mediaStream && mediaStream !== undefined) {
				console.log('localstream add');
				mediaStream.getTracks().forEach((track) => {
					pc.addTrack(track, mediaStream);
				});
			} else {
				console.log('no local stream');
			}
			return pc;
    }
    catch (e) {
			console.error(e);
			return undefined;
		}
  }

  // message notification context
  const [messageApi, messageContextHolder] = message.useMessage()
  const info = () => {
    messageApi.info({
      content: 'hello',
      icon: <Icon.AlertFilled />,
    })
  }
  // controll handler
  const toggleCollapsMessage = () => {
    if (isCollapsedMessage) {
      setIsCollapsedParticipant(true)
      setIsCollapsedMessage(false)
    } else {
      setIsCollapsedMessage(true)
    }
  }
  const toggleCollapsParticipant = () => {
    if (isCollapsedParticipant) {
      setIsCollapsedMessage(true)
      setIsCollapsedParticipant(false)
    } else {
      setIsCollapsedParticipant(true)
    }
  }
  const toggleOpenMic = () => {
    setIsOpenMic((cur) => !cur)
  }
  const toggleOpenCamera = () => {
    setIsOpenCamera((cur) => !cur)
  }
  const toggleShareScreen = async () => {
    if (!isShareScreen) {
      setIsShareScreen(true)
      try {
        const screenMedia = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true,
        })
        if (!screenSocketRef.current) {
          screenSocketRef.current = io(API_URL)
        } else {
          screenSocketRef.current.connect()
        }

        screenMedia.getTracks().forEach((track) => {
          track.onended = () => {
            console.log('end share screen media')
            setIsShareScreen(false)
            screenSocketRef.current?.disconnect()
          }
        })
        screenStreamRef.current = screenMedia
        await waitApi(2000)
        joinRoom({
          roomCode: searchParams.get('roomCode')!,
          username: roomInfo.members.find((m) => m.socketId === socket.id)?.username + '(Share)',
          socketId: screenSocketRef.current?.id ?? '',
        })
          .unwrap()
          .then(async (value) => {
            value.room.members
              .filter((m) => m.socketId !== screenSocketRef.current?.id)
              .forEach((m) => {
                // const newPeer = pushNewPeer(
                //   screenPeerInstanceList.current,
                //   screenSocketRef.current!.id,
                //   m.socketId
                // )
              })
            // await waitApi(2000)
            // screenPeerInstanceList.current.forEach((p) =>
            //   p.peer.call(p.socketId + screenSocketRef.current!.id, screenStreamRef.current!)
            // )
            // screenSocketRef.current?.emit(SOCKET_EVENT.EMIT.JOIN_ROOM, {
            //   roomCode: value.room.code,
            //   socketId: screenSocketRef.current.id,
            // })
          })
      } catch (err: any) {
        console.log(err.name + ': ' + err.message)
        setIsShareScreen(false)
      }
    } else {
      setIsShareScreen(false)
      console.log('end share screen media')
      screenStreamRef.current?.getTracks().forEach((track) => track.stop())
      screenSocketRef.current?.disconnect()
    }
  }
  const leaveCall = async () => {
    screenSocketRef.current?.disconnect()
    screenStreamRef.current?.getTracks()?.forEach((track) => track.stop())
    mediaStream?.getTracks().forEach((track) => track.stop())
    socket?.disconnect()
    navigate(rc(RouteKey.JoinRoom).path)
    dispatch(leaveRoom())
  }
  const shareRoom = () => {
    navigator.clipboard.writeText(window.location.href)
    messageApi.success({
      content: 'Copy link to room successfully',
      icon: <Icon.CheckCircleOutlined />,
    })
  }
  const handleUserConnect = async (user: User) => {
    const pc = createPeerConnection(user.socketId, user.username);
    if (!(pc && socket)) return;
    peerInstanceList.current = { ...peerInstanceList.current, [user.socketId]: pc };		
    try {
      const localSdp = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      console.log('create offer success');
      await pc.setLocalDescription(new RTCSessionDescription(localSdp));
      socket.emit('offer', {
        sdp: localSdp,
        offerSendID: socket.id,
        offerSendEmail: '',
        offerReceiveID: user.socketId,
      });
      notification.info({
        message: user.username.includes('Share')
          ? `${user.username} shared screen`
          : `${user.username} joined room`,
      })
      dispatch(pushNewUserToRoom(user))
    } catch (e) {
      console.error(e);
    }
  }
  // peer event handler
  const handleGetOffer = async (data: {
    sdp: RTCSessionDescription;
    offerSendID: string;
    offerSendEmail: string;}
    ) => {
      const { sdp, offerSendID, offerSendEmail } = data;
				console.log('get offer');
				const pc = createPeerConnection(offerSendID, offerSendEmail);
				if (!(pc&&socket)) return;
				peerInstanceList.current = { ...peerInstanceList.current, [offerSendID]: pc };
				try {
					await pc.setRemoteDescription(new RTCSessionDescription(sdp));
					console.log('answer set remote description success');
					const localSdp = await pc.createAnswer({
						offerToReceiveVideo: true,
						offerToReceiveAudio: true,
					});
					await pc.setLocalDescription(new RTCSessionDescription(localSdp));
				  socket.emit('answer', {
						sdp: localSdp,
						answerSendID: socket.id,
						answerReceiveID: offerSendID,
					});
				} catch (e) {
					console.error(e);
				}
  }
  // socket event
  const handleUserDisconnected = (user: User) => {
    if (roomInfo.members.find((m) => m.socketId === user.socketId)) {
      if (!user.username.includes('Share')) {
        notification.info({
          message: `${user.username} left room`,
        })
      }
      trigger(roomInfo.code, false)
    }
  }
  const handleDisconnect = async (reason: any) => {
    // alert('Disconnect')
    console.log(reason)
    screenSocketRef.current?.disconnect()
    screenStreamRef.current?.getTracks()?.forEach((track) => track.stop())
    if (reason === 'io server disconnect' || reason === 'transport close') {
      socket?.connect()
      modal.confirm({
        title: `Socket is disconnected by ${reason}`,
        content: 'Do you want to reconnect',
        okText: 'OK',
        onOk: () => {
          joinRoom({
            roomCode: searchParams.get('roomCode')!,
            username : '',
            socketId: socket?.id ?? '',
          })
            .unwrap()
            .then(async (value) => {
              value.room.members
                .filter((m) => m.socketId !== socket.id)
                .forEach((m) => {
                  // const newPeer = createPeerConnection(peerInstanceList.current, socket.id, m.socketId)
                })
            })
        },
        cancelText: 'Cancel',
        onCancel: () => {
          leaveCall()
        },
      })
      socket.on('connect', () => {})
    } else {
      leaveCall()
    }
  }
  // get stream
  const getMyMediaStream = async (camera: boolean, mic: boolean) => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: mic,
        video: camera,
      })
      setMediaStream(media)
    } catch (err: any) {
      console.log(err.name + ': ' + err.message)
    }
  }
  //handle not existing room
  useEffect(() => {
    if (!searchParams.get('roomCode')) {
      navigate(rc(RouteKey.JoinRoom).path)
    } else {
    }
  }, [])
  // handle socket event
  useEffect(() => {
    // new user joined room
    socket?.on(SOCKET_EVENT.ON.USER_CONNECTED, handleUserConnect)
    // user left room
    socket?.on(SOCKET_EVENT.ON.USER_DISCONNECTED, handleUserDisconnected)
    // disconnect
    socket?.on('getOffer', handleGetOffer)
    socket?.on('getAnswer', (data: { sdp: RTCSessionDescription; answerSendID: string }) => {
      const { sdp, answerSendID } = data;
      console.log('get answer');
      const pc: RTCPeerConnection = peerInstanceList.current[answerSendID];
      if (!pc) return;
      pc.setRemoteDescription(new RTCSessionDescription(sdp));
    },)

    socket.on(
			'getCandidate',
			async (data: { candidate: RTCIceCandidateInit; candidateSendID: string }) => {
				console.log('get candidate');
				const pc: RTCPeerConnection = peerInstanceList.current[data.candidateSendID];
				if (!pc) return;
				await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).then( (e)=>
          console.log('candidate add success')
        )
			},
		);

    socket?.on('disconnect', handleDisconnect)
    return () => {
			streamList.forEach((user) => {
				if (!peerInstanceList.current[user.socketId]) return;
				peerInstanceList.current[user.socketId].close();
				delete peerInstanceList.current[user.socketId];
			});
      socket?.off(SOCKET_EVENT.ON.USER_CONNECTED)
      socket?.off(SOCKET_EVENT.ON.USER_DISCONNECTED)
      socket?.off('disconnect')
    }
  }, [socket,handleGetOffer, handleUserConnect, handleUserDisconnected, handleDisconnect])

  useEffect(() => {
    if (isOpenCamera || isOpenMic) {
      getMyMediaStream(isOpenCamera, isOpenMic)
    }
    if (!isOpenMic && mediaStream?.getAudioTracks()) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = false
        track.stop()
      })
    }
    if (!isOpenCamera && mediaStream?.getVideoTracks()) {
      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = false
        track.stop()
      })
    }
  }, [isOpenCamera, isOpenMic])

  useEffect(() => {
    console.log('media change')
    if (mediaStream && roomInfo.members.length > 1) {
      roomInfo.members.forEach(
        async (user) => {
          const pc = peerInstanceList.current[user.socketId];
          if(mediaStream !== undefined)
          {
            mediaStream.getTracks().forEach((track) => {
              pc.addTrack(track, mediaStream);
            });
          }
        }
      )
    }
  }, [mediaStream])

  if (!searchParams.get('roomCode')) return <PrepairRoom />
  const [modal, modalContextHolder] = Modal.useModal()
  return (
    <Spin spinning={isLoadingJoinRoom}>
      <Layout
        className={styles.room}
        style={{ backgroundImage: `url("${getResourceUrl(PAGE_INFO.BACKGROUND)}") ` }}
      >
        {messageContextHolder}
        {!isInLobby ? (
          <>
            <Layout.Content style={{ position: 'relative' }}>
              <Space className={styles['btn-control']}>
                <Button
                  type={isOpenMic ? 'primary' : 'default'}
                  onClick={toggleOpenMic}
                  icon={isOpenMic ? <Icon.AudioOutlined /> : <Icon.AudioMutedOutlined />}
                  size="large"
                ></Button>
                <Button
                  type={isOpenCamera ? 'primary' : 'default'}
                  onClick={toggleOpenCamera}
                  icon={isOpenCamera ? <Icon.CameraOutlined /> : <Icon.CameraOutlined />}
                  size="large"
                ></Button>
                <Button
                  type={isCollapsedMessage ? 'default' : 'primary'}
                  onClick={toggleCollapsMessage}
                  icon={<Icon.MessageOutlined />}
                  size="large"
                ></Button>
                <Button
                  type={isShareScreen ? 'primary' : 'default'}
                  onClick={toggleShareScreen}
                  icon={<Icon.LaptopOutlined />}
                  size="large"
                ></Button>
                <Button
                  type={isCollapsedParticipant ? 'default' : 'primary'}
                  onClick={() => {
                    toggleCollapsParticipant()
                  }}
                  icon={<Icon.TeamOutlined />}
                  size="large"
                ></Button>
                <Button onClick={info} icon={<Icon.AlertOutlined />} size="large"></Button>
                <Button
                  onClick={shareRoom}
                  icon={<Icon.ShareAltOutlined />}
                  size="large"
                ></Button>
                <Button
                  onClick={leaveCall}
                  icon={<Icon.LogoutOutlined />}
                  danger
                  type="primary"
                  size="large"
                ></Button>
              </Space>
              <UserGrid<User>
                pinUser={pinUser}
                users={roomInfo.members}
                renderItems={(item, idx) => (
                  <UserFrame<User>
                    key={idx}
                    user={item}
                    isPin={pinUser === item}
                    onClickPin={(user) => {
                      if (user === pinUser) {
                        setPinUser(undefined)
                      } else {
                        setPinUser(user)
                      }
                    }}
                    
                    stream={
                      item.socketId === socket?.id
                        ? mediaStream
                        : item.socketId === screenSocketRef.current?.id
                        ? screenStreamRef.current
                        : streamList.find((e) => e.socketId === item.socketId)?.remoteStream
                    }
                    muted={item.socketId === socket?.id}
                    isTurnOnCamera={
                      item.socketId === socket?.id
                        ? isOpenCamera
                        : item.socketId === screenSocketRef.current?.id
                        ? isOpenCamera
                        : streamList.find((e) => e.socketId === item.socketId)?.remoteStream !==
                          undefined
                    }
                    isYou={item.socketId === socket?.id ? true : false}
                  />
                )}
              />
              {modalContextHolder}
            </Layout.Content>
            <Layout.Sider
              collapsible={true}
              collapsed={isCollapsedMessage}
              trigger={null}
              width={400}
              collapsedWidth={0}
            >
              <IncallMessage isCollapsed={isCollapsedMessage} onCollapse={toggleCollapsMessage} />
            </Layout.Sider>
            <Layout.Sider
              collapsible={true}
              collapsed={isCollapsedParticipant}
              trigger={null}
              width={400}
              collapsedWidth={0}
            >
              <Participant
                isCollapsed={isCollapsedParticipant}
                onCollapse={toggleCollapsParticipant}
              />
            </Layout.Sider>
          </>
        ) : (
          <Layout.Content>
            <Overlay
              stream={mediaStream}
              onToggleCam={(toggle) => setIsOpenCamera(toggle)}
              onToggleMic={(toggle) => setIsOpenMic(toggle)}
              onEnterUserID={async (username) => {
                joinRoom({
                  roomCode: searchParams.get('roomCode')!,
                  username,
                  socketId: socket?.id ?? '',
                })
                  .unwrap()
                  .then(async (value) => {
                      socket?.emit(SOCKET_EVENT.EMIT.JOIN_ROOM, {
                        roomCode: value.room.code,
                        socketId: socket.id,
                      })
                  }).then(() =>      
                    setIsInLobby(false)
                  ).catch(
                    e => console.log(e)
                  )

              }}
            />
          </Layout.Content>
        )}
      </Layout>
    </Spin>
  )
}
