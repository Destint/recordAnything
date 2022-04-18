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
    let wishDoc = await db.collection('wish').where({
      _openid: wxContext.OPENID
    }).get();
    if (wishDoc.data[0]) {
      let wish = {};
      let wishList = wishDoc.data[0].wishList;
      wish['content'] = event.wish;
      wish['startDate'] = formatTime(new Date());
      wish['id'] = new Date().getTime();
      wish['state'] = false;
      wish['set'] = false;
      wish['finishDate'] = '';
      wishList.unshift(wish);
      await db.collection('wish').where({
        _openid: wxContext.OPENID
      }).update({
        data: {
          wishList: _.unshift(wish)
        }
      })
      return {
        result: true,
        wishList: wishList
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