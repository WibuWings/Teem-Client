import { Button, Card, Drawer, Input, Layout, message, Space } from 'antd'
import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as Icon from '@ant-design/icons'

import { PrepairRoom } from './components/PrepairRoom'

import styles from './style.module.less'
import { rc, RouteKey } from '@/routes'
import { UserGrid } from './components/UserGrid/UserGrid'
import { IncallMessage } from './components/IncallMessage'
import { UserFrame } from './components/UserFrame'

type RoomParams = {
  roomID: string
}

export function Room() {
  const params = useParams<RoomParams>()
  const navigate = useNavigate()
  const [isCollapsedMessage, setIsCollapsedMessage] = useState(false)
  const [isOpenMic, setIsOpenMic] = useState(false)
  const [isOpenCamera, setOpenCamera] = useState(false)

  const numberOfUser = 10
  const users = [...Array(numberOfUser).keys()]
  const [pinUser, setPinUser] = useState<number | undefined>(users[0])

  const [messageApi, contextHolder] = message.useMessage()

  const info = () => {
    messageApi.warning({
      content: 'hello',
      icon: <Icon.AlertFilled />,
    })
  }

  // controll handler
  const toggleCollapsMessage = () => {
    setIsCollapsedMessage((cur) => !cur)
  }
  const toggleOpenMic = () => {
    setIsOpenMic((cur) => !cur)
  }
  const toggleOpenCamera = () => {
    setOpenCamera((cur) => !cur)
  }
  const leaveCall = () => {
    navigate(rc(RouteKey.JoinRoom).path)
  }
  return (
    <Layout className={styles.room}>
      {contextHolder}
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
            type={isCollapsedMessage ? 'default' : 'primary'}
            onClick={toggleCollapsMessage}
            icon={<Icon.LaptopOutlined />}
            size="large"
          ></Button>
          <Button onClick={info} icon={<Icon.AlertOutlined />} size="large"></Button>
          <Button
            onClick={leaveCall}
            icon={<Icon.LogoutOutlined />}
            danger
            type="primary"
            size="large"
          ></Button>
        </Space>
        <UserGrid
          pinUser={pinUser}
          users={users}
          renderItems={(item, idx) => (
            <UserFrame
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
            />
          )}
        />
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
    </Layout>
  )
}
