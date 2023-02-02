import { Button, Space, Spin } from 'antd'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import * as Icon from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { rc, RouteKey } from '@/routes'
import styles from './style.module.less'
import { getResourceUrl } from '@/transforms/url'
import { PAGE_INFO } from '@/constants/page'
import { User } from '../../model'


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
  // auto resize video
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
      if (!stream) {
        video.srcObject = null
      } else {
        video.srcObject = stream
        video.onloadedmetadata = function (e) {
          video.play()
        }
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
          zIndex: 1000
        }}
      >
        <Button
          type={isPin ? 'primary' : 'default'}
          onClick={() => {
            onClickPin(user)
          }}
          icon={<Icon.PushpinOutlined />}
          size="small"
        ></Button>
        <h3 style={{color: 'white'  }}>{(user as User).username}</h3>
      </Space>
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{ height: '100%', width: '100%', objectFit: 'contain', backgroundColor: 'yellow'}}
        />
    </div>
  )
}

export function OverflowUser({ numberOverflow }: { numberOverflow: number }) {
  return <div className={styles['user-frame']}>+{numberOverflow}</div>
}
