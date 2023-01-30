import { Button, Space } from 'antd'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import * as Icon from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { rc, RouteKey } from '@/routes'
import styles from './style.module.less'
import ReactPlayer from 'react-player'
import { url } from 'inspector'

export function UserFrame<Type>({
  user,
  isPin,
  onClickPin,
  stream,
  muted,
}: {
  user: Type
  isPin: boolean
  stream?: MediaStream
  muted: boolean
  onClickPin: (user: Type) => void
}): ReactElement {
  const params = useParams()
  const navigate = useNavigate()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isOpenMic, setIsOpenMic] = useState(false)

  const [isOpenCam, setIsOpenCam] = useState(false)

  // controll handler
  const toggleOpenMic = () => {
    setIsOpenMic((cur) => !cur)
  }
  const leaveCall = () => {
    navigate(rc(RouteKey.JoinRoom).path)
  }

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.srcObject = stream
      video.onloadedmetadata = function (e) {
        video.play()
      }
    }
  }, [videoRef.current, stream])
  return (
    <div
      className={styles['user-frame']}
      onMouseOver={(e) => {
        setIsOpenCam(true)
      }}
      onMouseOut={(e) => {
        setIsOpenCam(false)
      }}
    >
      <Space
        style={{
          position: 'absolute',
          left: '10px',
          top: '10px',
          visibility: isOpenCam ? 'visible' : 'hidden',
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
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ height: '200px', width: '200px', objectFit: 'contain' }}
      />
    </div>
  )
}

export function OverflowUser({ numberOverflow }: { numberOverflow: number }) {
  return <div className={styles['user-frame']}>+{numberOverflow}</div>
}
