import { Button, Card, Input, Space, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import * as Icon from '@ant-design/icons'
import styles from './style.module.less'
import { MessageFrom, MessageType } from '@/models/message'
import moment from 'moment'
import { FORMAT } from '@/constants/date'
import { Form } from 'antd'
import { useAppDispatch, useAppSelector, useSocketContext } from '@/hooks'
import { pushMessage } from '../../slice'
import { SOCKET_EVENT } from '@/providers/Socket'

type Props = {
  isCollapsed: boolean
  onCollapse: () => void
}

export function Participant(props: Props) {
  const roomInfo = useAppSelector((state) => state.room)
  const { socket } = useSocketContext()
  const [roomParticipants, setRoomParticipants] = useState(roomInfo.members)

  useEffect(() => {
    setRoomParticipants(roomInfo.members)
  }, [roomInfo])

  return (
    <Card
      title={`Participants in room (${roomInfo.members.length})`}
      className={styles.drawer}
      extra={
        <Button icon={<Icon.CloseOutlined />} type="text" onClick={props.onCollapse}></Button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <Input.Search
        onSearch={(value: string) => {
          const trimmed = value.trim()
          const keywordRegExp = new RegExp(trimmed, 'i')
          setRoomParticipants(roomInfo.members.filter((m) => keywordRegExp.test(m.username)))
        }}
        style={{ width: '100%' }}
        autoFocus={true}
      ></Input.Search>
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {roomParticipants.map((mem, idx) => (
          <ParticipantEle
            key={idx}
            name={`${mem.username} ${mem.socketId === socket.id ? '(You)' : ''}`}
            isHost={Boolean(roomInfo.host?.socketId === mem.socketId)}
          />
        ))}
      </div>
    </Card>
  )
}

export type ParticipantProps = {
  name: string
  isHost: boolean
}

export function ParticipantEle(props: ParticipantProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography.Title level={5} style={{ margin: 0 }}>
        {props.name}
      </Typography.Title>
      <Typography.Text>{props.isHost ? 'Meeting host' : ''}</Typography.Text>
    </div>
  )
}
