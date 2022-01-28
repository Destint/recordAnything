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
    const wxContext = cloud.getWXContext();
    if (!event.noticeData) {
      let showSetNoticeFunction = false;
      if (wxContext.OPENID == 'oAxl85AwyxMZUG--D7vH25zQoxqE') showSetNoticeFunction = true;
      return {
        result: true,
        showSetNoticeFunction: showSetNoticeFunction
      }
    }
    if (wxContext.OPENID != 'oAxl85AwyxMZUG--D7vH25zQoxqE') {
      return {
        result: false
      }
    }
    let noticeDoc = await db.collection('notice').where({
      _id: '8937eaa9613daffc0aa0e12b080c9859'
    }).get();
    if (noticeDoc.data[0]) {
      let noticeData = {};
      noticeData['notice'] = event.noticeData;
      noticeData['date'] = formatTime(new Date());
      await db.collection('notice').where({
        _id: '8937eaa9613daffc0aa0e12b080c9859'
      }).update({
        data: {
          noticeData: _.unshift(noticeData)
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