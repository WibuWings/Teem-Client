import { Button, Space } from 'antd'
import React, { useState } from 'react'
import * as Icon from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { rc, RouteKey } from '@/routes'
import styles from './style.module.less'

export function UserFrame() {
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
          type={isOpenMic ? 'primary' : 'default'}
          onClick={toggleOpenMic}
          icon={isOpenMic ? <Icon.PushpinOutlined /> : <Icon.PushpinOutlined />}
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
    </div>
  )
}
