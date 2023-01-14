import { Button, Space } from 'antd'
import React, { ReactElement, useState } from 'react'
import * as Icon from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { rc, RouteKey } from '@/routes'
import styles from './style.module.less'
import ReactPlayer from 'react-player'

export function UserFrame<Type>({
  user,
  isPin,
  onClickPin,
  stream,
  displayStream,
  muted,
}: {
  user: Type
  isPin: boolean
  stream?: MediaStream
  displayStream? : DisplayMediaStreamOptions
  muted: boolean
  onClickPin: (user: Type) => void
}): ReactElement {
  const params = useParams()
  const navigate = useNavigate()
  const [isOpenMic, setIsOpenMic] = useState(false)

  const [isVisible, setIsVisible] = useState(false)

  // controll handler
  const toggleOpenMic = () => {
    setIsOpenMic((cur) => !cur)
  }
  const leaveCall = () => {
    navigate(rc(RouteKey.JoinRoom).path)
  }
  return (
    <div
      className={styles['user-frame']}
      onMouseOver={(e) => {
        setIsVisible(true)
      }}
      onMouseOut={(e) => {
        setIsVisible(false)
      }}
    >
      <Space
        style={{
          position: 'absolute',
          left: '10px',
          top: '10px',
          visibility: isVisible ? 'visible' : 'hidden',
        }}
      >
        <Button
          type={isOpenMic ? 'primary' : 'default'}
          onClick={toggleOpenMic}
          icon={isOpenMic ? <Icon.AudioOutlined /> : <Icon.AudioMutedOutlined />}
          size="small"
        ></Button>
        <Button
          type={isPin ? 'primary' : 'default'}
          onClick={() => {
            onClickPin(user)
          }}
          icon={<Icon.PushpinOutlined />}
          size="small"
        ></Button>
        <Button
          onClick={leaveCall}
          icon={<Icon.CloseOutlined />}
          danger
          type="primary"
          size="small"
        ></Button>
      </Space>
      <ReactPlayer url={stream} playing muted={muted} />
    </div>
  )
}

export function OverflowUser({ numberOverflow }: { numberOverflow: number }) {
  return <div className={styles['user-frame']}>+{numberOverflow}</div>
}
