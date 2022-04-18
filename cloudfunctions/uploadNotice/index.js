const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
}

function formatTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`;
}

exports.main = async (event, context) => {
  try {
    let noticeDoc = await db.collection('notice').where({
      _id: '8937eaa9613daffc0aa0e12b080c9859'
    }).get();
    if (noticeDoc.data[0]) {
      let notice = {};
      notice['notice'] = event.notice;
      notice['date'] = formatTime(new Date());
      await db.collection('notice').where({
        _id: '8937eaa9613daffc0aa0e12b080c9859'
      }).update({
        data: {
          noticeList: _.unshift(notice)
        }
      })
      return {
        result: true
      }
    } else {
      return {
        result: false
      }
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}