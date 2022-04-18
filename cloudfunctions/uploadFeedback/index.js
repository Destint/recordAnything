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
    let feedbackDoc = await db.collection('feedback').where({
      _openid: wxContext.OPENID
    }).get();
    let feedbackList = [];
    let feedback = {};
    feedback['feedbackContent'] = event.feedbackContent;
    feedback['cloudPicPathList'] = event.cloudPicPathList;
    feedback['date'] = formatTime(new Date());
    feedbackList.unshift(feedback);
    if (!feedbackDoc.data[0]) {
      await db.collection('feedback').add({
        data: {
          feedbackList: feedbackList,
          _openid: wxContext.OPENID
        }
      });
    } else {
      await db.collection('feedback').where({
        _openid: wxContext.OPENID
      }).update({
        data: {
          feedbackList: _.unshift(feedback)
        }
      })
    }
    return {
      result: true
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}