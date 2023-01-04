/**
 * @file

 */

import moment from 'moment'

export const momentToTimestamp = (moment: moment.Moment) => moment.unix()

export const timestampToMoment = (timestamp: number) => moment.unix(timestamp)

export const timestampToYMD = (timestamp: number) => {
  return moment(timestamp)?.format('YYYY-MM-DD HH:mm:ss')
}

export const stringToYMD = (timestamp: string) => {
  return moment(timestamp)?.format('YYYY-MM-DD HH:mm:ss')
}
