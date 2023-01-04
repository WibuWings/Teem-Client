/**
 * @file App 404 page

 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Result, Button } from 'antd'

import styles from './style.module.less'
import { rc, RouteKey } from '@/routes'

export const NotFoundPage: React.FC = () => (
  <div className={styles.notFound}>
    <Result
      status="warning"
      title="404 NOT FOUND"
      extra={
        <Link to={rc(RouteKey.Dashboard).path}>
          <Button type="link">Go Home</Button>
        </Link>
      }
    />
  </div>
)
